import { describe, expect, test, vi } from 'vitest';
import { GroupService } from '#electron/Application/Services/GroupService';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { GroupCreatedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { GroupStrapPayload } from '#electron/Domain/Protocol/Payload';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { generateEpochKey, generateWriteKeyPair, publicKeyFromPrivate } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { Result } from '#shared/Result/Result';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function setup() {
    const ownWriteKey = generateWriteKeyPair();
    const group = new Group(GROUP_ID);

    const ledgerWriter = {
        createStream: vi.fn(async (_groupId: string, _invites: Buffer[], _operation: GroupCreatedOperation) =>
            Result.success(Buffer.alloc(32, 0x0f)),
        ),
    };

    const sut = new GroupService(
        { get: async () => group, update: async () => undefined } as never,
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
        { publicKey: async () => Buffer.from('alice-identity') } as never,
    );

    return { sut, ledgerWriter, ownWriteKey, group };
}

describe('starting a group', () => {
    test('mints one invite key for every other device and grants only those to the ledger', async () => {
        const { sut, ledgerWriter } = setup();

        const result = await sut.startGroup(GROUP_ID);

        const straps = result.data!;
        expect(Object.keys(straps).sort()).toEqual(['alice-phone', 'bob-laptop', 'bob-phone']);

        const [, invites] = ledgerWriter.createStream.mock.calls[0];
        const strapKeys = Object.values(straps).map((payloads) =>
            publicKeyFromPrivate(Buffer.from((payloads[0] as GroupStrapPayload).inviteKeyPrivate, 'base64')),
        );

        expect(invites.map((key) => key.toString('hex')).sort()).toEqual(strapKeys.map((key) => key.toString('hex')).sort());
        expect(new Set(strapKeys.map((key) => key.toString('hex'))).size).toBe(3);
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

        const [, , operation] = ledgerWriter.createStream.mock.calls[0];
        const [alice, bob] = operation.members;
        const inviteKeyOf = (connectionId: string) =>
            publicKeyFromPrivate(Buffer.from((straps[connectionId][0] as GroupStrapPayload).inviteKeyPrivate, 'base64')).toString('base64');

        expect(alice.writeKeys).toEqual([ownWriteKey.publicKey.toString('base64')]);
        expect(alice.inviteKeys).toEqual([inviteKeyOf('alice-phone')]);
        expect(bob.writeKeys).toEqual([]);
        expect(bob.inviteKeys).toEqual([inviteKeyOf('bob-laptop'), inviteKeyOf('bob-phone')]);
    });

    test('activates the group', async () => {
        const { sut, group } = setup();

        await sut.startGroup(GROUP_ID);

        expect(group.lifecycle).toBe(GroupLifecycle.Active);
    });
});
