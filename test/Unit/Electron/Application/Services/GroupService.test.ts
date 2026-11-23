import { describe, expect, test, vi } from 'vitest';
import { GroupService } from '#electron/Application/Services/GroupService';
import { SealedCreate } from '#electron/Application/Contracts/Services/ILedgerWriter';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { GroupCreatedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { GroupStrapPayload } from '#electron/Domain/Protocol/Payload';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { WriteKeyRole } from '#electron/Domain/Enums/WriteKeyRole';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { keyChangesFor } from '#electron/Domain/Services/GroupReducer';
import { generateEpochKey, generateWriteKeyPair, publicKeyFromPrivate } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function setup(createResults: Result<void>[] = []) {
    const ownWriteKey = generateWriteKeyPair();
    const group = new Group(GROUP_ID);
    const saved: Group[] = [];

    const ledgerWriter = {
        sealCreate: vi.fn(async (groupId: string, operation: GroupCreatedOperation) =>
            Result.success<SealedCreate>({
                payload: Buffer.from([1, 2, 3]),
                signature: Buffer.alloc(64, 0x07),
                hash: Buffer.alloc(32, 0x0f),
                invites: keyChangesFor(new GroupState(groupId), operation).invites,
            }),
        ),
        createStream: vi.fn(async (_groupId: string, _sealed: SealedCreate) =>
            createResults.shift() ?? Result.success(),
        ),
    };

    const sut = new GroupService(
        {
            get: async () => group,
            update: async (updated: Group) => {
                saved.push(structuredClone(updated));
            },
        } as never,
        {
            getWriteKey: async () => new GroupWriteKey(GROUP_ID, ownWriteKey.publicKey, ownWriteKey.privateKey),
            getEpochKey: async () => new GroupEpochKey(GROUP_ID, 1, generateEpochKey()),
        } as never,
        {
            get: async () => ({
                userTag: '111111111111',
                displayName: 'Alice',
                username: 'alice',
                avatarKey: null,
                connectionIds: [{ connectionId: 'alice-laptop' }, { connectionId: 'alice-phone' }],
            }),
        } as never,
        { get: async () => ({ connectionId: 'alice-laptop' }) } as never,
        {
            getChatWithMembers: async () => ({
                groupName: 'Trip',
                members: [
                    {
                        userTag: '222222222222',
                        displayName: 'Bob',
                        privilege: ChatPrivileges.Member,
                        devices: ['bob-laptop', 'bob-phone'],
                        friend: { avatarKey: null },
                    },
                ],
            }),
        } as never,
        ledgerWriter as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
    );

    return { sut, ledgerWriter, ownWriteKey, group, saved };
}

function inviteKeyOf(straps: Record<string, GroupStrapPayload>, connectionId: string): string {
    return publicKeyFromPrivate(Buffer.from(straps[connectionId].inviteKeyPrivate, 'base64')).toString('base64');
}

const conflict = () => Result.fail(new ErrorMessage('Conflict', 'Ledger already exists.'));

describe('starting a group', () => {
    test('mints one invite key for every other device and grants only those to the ledger', async () => {
        const { sut, ledgerWriter } = setup();

        const straps = (await sut.startGroup(GROUP_ID)).data!;

        expect(Object.keys(straps).sort()).toEqual(['alice-phone', 'bob-laptop', 'bob-phone']);

        const [, sealed] = ledgerWriter.createStream.mock.calls[0];
        const strapKeys = Object.keys(straps).map((connectionId) => inviteKeyOf(straps, connectionId));

        expect(sealed.invites.map((grant) => grant.publicKey).sort()).toEqual([...strapKeys].sort());
        expect(new Set(strapKeys).size).toBe(3);
    });

    test('invites every member as a writer and the creator own devices as owner', async () => {
        const { sut, ledgerWriter } = setup();

        const straps = (await sut.startGroup(GROUP_ID)).data!;

        const [, sealed] = ledgerWriter.createStream.mock.calls[0];
        const roleOf = (connectionId: string) => sealed.invites.find((grant) => grant.publicKey === inviteKeyOf(straps, connectionId))?.role;

        expect(roleOf('bob-laptop')).toBe(WriteKeyRole.Writer);
        expect(roleOf('bob-phone')).toBe(WriteKeyRole.Writer);
        expect(roleOf('alice-phone')).toBe(WriteKeyRole.Owner);
    });

    test('never sends the creator write key to another device', async () => {
        const { sut, ownWriteKey } = setup();

        const straps = (await sut.startGroup(GROUP_ID)).data!;

        for (const strap of Object.values(straps)) {
            expect(strap.inviteKeyPrivate).not.toBe(ownWriteKey.privateKey.toString('base64'));
        }
    });

    test('declares the creator write key and each member invite keys in the creation', async () => {
        const { sut, ledgerWriter, ownWriteKey } = setup();

        const straps = (await sut.startGroup(GROUP_ID)).data!;

        const [, operation] = ledgerWriter.sealCreate.mock.calls[0];
        const [alice, bob] = operation.members;

        expect(alice.writeKeys).toEqual([ownWriteKey.publicKey.toString('base64')]);
        expect(alice.inviteKeys).toEqual([inviteKeyOf(straps, 'alice-phone')]);
        expect(bob.writeKeys).toEqual([]);
        expect(bob.inviteKeys).toEqual([inviteKeyOf(straps, 'bob-laptop'), inviteKeyOf(straps, 'bob-phone')]);
    });

    test('activates the group at version 1 with the created head and drops the pending start', async () => {
        const { sut, group } = setup();

        await sut.startGroup(GROUP_ID);

        expect(group.lifecycle).toBe(GroupLifecycle.Active);
        expect(group.version).toBe(1);
        expect(group.headHash).toEqual(Buffer.alloc(32, 0x0f));
        expect(group.pendingStart).toBeNull();
        expect(group.privilege).toBe(ChatPrivileges.Owner);
    });

    test('creates the stream once when two sends start the group at the same time', async () => {
        const { sut, ledgerWriter } = setup();

        const [first, second] = await Promise.all([sut.startGroup(GROUP_ID), sut.startGroup(GROUP_ID)]);

        expect(ledgerWriter.createStream).toHaveBeenCalledTimes(1);
        expect(Object.keys(first.data!)).toHaveLength(3);
        expect(second.success).toBe(true);
        expect(second.data).toBeNull();
    });

    test('keeps the prepared start when the create fails and retries it unchanged', async () => {
        const { sut, ledgerWriter, group, saved } = setup([conflict()]);

        const failed = await sut.startGroup(GROUP_ID);

        expect(failed.success).toBe(false);
        expect(group.lifecycle).toBe(GroupLifecycle.Draft);
        expect(saved[0].pendingStart).not.toBeNull();

        const retried = await sut.startGroup(GROUP_ID);

        expect(retried.success).toBe(true);
        expect(ledgerWriter.sealCreate).toHaveBeenCalledTimes(1);

        const [[, firstSealed], [, retrySealed]] = ledgerWriter.createStream.mock.calls;
        expect(retrySealed).toEqual(firstSealed);
        expect(Object.keys(retried.data!).map((connectionId) => inviteKeyOf(retried.data!, connectionId)).sort()).toEqual(
            firstSealed.invites.map((grant) => grant.publicKey).sort(),
        );
    });

    test('does nothing for a group that already started', async () => {
        const { sut, ledgerWriter, group } = setup();
        group.lifecycle = GroupLifecycle.Active;

        const result = await sut.startGroup(GROUP_ID);

        expect(result.data).toBeNull();
        expect(ledgerWriter.createStream).not.toHaveBeenCalled();
    });
});
