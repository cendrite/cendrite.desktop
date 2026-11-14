import { describe, expect, test, vi } from 'vitest';
import { GroupService } from '#electron/Application/Services/GroupService';
import { SealedCreate } from '#electron/Application/Contracts/Services/ILedgerWriter';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { GroupCreatedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { GroupStrapPayload, Payload } from '#electron/Domain/Protocol/Payload';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { generateEpochKey, generateWriteKeyPair, publicKeyFromPrivate } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function setup(createResults: Result<void>[] = []) {
    const ownWriteKey = generateWriteKeyPair();
    const group = new Group(GROUP_ID);
    const saved: Group[] = [];

    const ledgerWriter = {
        sealCreate: vi.fn(async (_groupId: string, _invites: Buffer[], _operation: GroupCreatedOperation) =>
            Result.success<SealedCreate>({
                payload: Buffer.from([1, 2, 3]),
                signature: Buffer.alloc(64, 0x07),
                hash: Buffer.alloc(32, 0x0f),
            }),
        ),
        createStream: vi.fn(async (_groupId: string, _invites: Buffer[], _sealed: SealedCreate) =>
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
                        devices: ['bob-laptop', 'bob-phone'],
                        friend: { avatarKey: null },
                    },
                ],
            }),
        } as never,
        ledgerWriter as never,
    );

    return { sut, ledgerWriter, ownWriteKey, group, saved };
}

function inviteKeyOf(straps: Record<string, Payload[]>, connectionId: string): string {
    const strap = straps[connectionId][0] as GroupStrapPayload;
    return publicKeyFromPrivate(Buffer.from(strap.inviteKeyPrivate, 'base64')).toString('base64');
}

const conflict = () => Result.fail(new ErrorMessage('Conflict', 'Ledger already exists.'));

describe('starting a group', () => {
    test('mints one invite key for every other device and grants only those to the ledger', async () => {
        const { sut, ledgerWriter } = setup();

        const straps = (await sut.startGroup(GROUP_ID)).data!;

        expect(Object.keys(straps).sort()).toEqual(['alice-phone', 'bob-laptop', 'bob-phone']);

        const [, invites] = ledgerWriter.createStream.mock.calls[0];
        const strapKeys = Object.keys(straps).map((connectionId) => inviteKeyOf(straps, connectionId));

        expect(invites.map((key) => key.toString('base64')).sort()).toEqual([...strapKeys].sort());
        expect(new Set(strapKeys).size).toBe(3);
    });

    test('never sends the creator write key to another device', async () => {
        const { sut, ownWriteKey } = setup();

        const straps = (await sut.startGroup(GROUP_ID)).data!;

        for (const payloads of Object.values(straps)) {
            expect((payloads[0] as GroupStrapPayload).inviteKeyPrivate).not.toBe(ownWriteKey.privateKey.toString('base64'));
        }
    });

    test('declares the creator write key and each member invite keys in the creation', async () => {
        const { sut, ledgerWriter, ownWriteKey } = setup();

        const straps = (await sut.startGroup(GROUP_ID)).data!;

        const [, , operation] = ledgerWriter.sealCreate.mock.calls[0];
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

        const [[, firstInvites, firstSealed], [, retryInvites, retrySealed]] = ledgerWriter.createStream.mock.calls;
        expect(retryInvites).toEqual(firstInvites);
        expect(retrySealed).toEqual(firstSealed);
        expect(Object.keys(retried.data!).map((connectionId) => inviteKeyOf(retried.data!, connectionId)).sort()).toEqual(
            firstInvites.map((key) => key.toString('base64')).sort(),
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
