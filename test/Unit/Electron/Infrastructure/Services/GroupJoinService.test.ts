import { describe, expect, test, vi } from 'vitest';
import { GroupJoinService } from '../../../../../src/Electron/Infrastructure/Services/GroupJoinService.js';
import { GroupCreatedPayload } from '../../../../../src/Electron/Application/Contracts/Messaging/Envelope.js';
import { GroupMemberRef } from '../../../../../src/Electron/Domain/Operations/LedgerOperation.js';
import { IGroupKeyRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { IChatStore } from '../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { IUserRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IUserRepository.js';
import { ILedgerSyncService } from '../../../../../src/Electron/Application/Contracts/Services/ILedgerSyncService.js';
import { Chat } from '../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { GroupEpochKey } from '../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import { GroupRecord } from '../../../../../src/Electron/Domain/Entities/GroupRecord.js';
import { GroupLifecycle } from '../../../../../src/Electron/Domain/Enums/GroupLifecycle.js';
import { ChatPrivileges } from '../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';
import { generateWriteKeyPair, publicKeyFromPrivate } from '../../../../../src/Electron/Infrastructure/Crypto/LedgerCodec.js';
import { User } from '../../../../../src/Electron/Domain/Aggregates/User.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const EPOCH_KEY = Buffer.alloc(32, 0x07);

function payload(forTag = 'bob', writeKeyPrivate = generateWriteKeyPair().privateKey): GroupCreatedPayload {
    const members: GroupMemberRef[] = [
        { userTag: 'alice', displayName: 'Alice', privilege: ChatPrivileges.Owner, identityKey: 'alice-identity', writeKeyPublic: 'alice-key', connectionIds: ['alice-device'] },
        { userTag: forTag, displayName: 'Bob', privilege: ChatPrivileges.Member, identityKey: 'bob-identity', writeKeyPublic: 'bob-key', connectionIds: ['bob-device'] },
    ];

    return new GroupCreatedPayload(
        GROUP_ID,
        'Trip',
        1,
        EPOCH_KEY.toString('base64'),
        writeKeyPrivate.toString('base64'),
        members,
        ['alice', forTag],
    );
}

function harness(existing: Chat | null = null) {
    const epochKeys: GroupEpochKey[] = [];
    const writeKeys: GroupWriteKey[] = [];
    const chats: Chat[] = [];
    const groups: GroupRecord[] = [];

    const groupKeyRepository = {
        saveEpochKey: async (k: GroupEpochKey) => void epochKeys.push(k),
        saveWriteKey: async (k: GroupWriteKey) => void writeKeys.push(k),
    } as unknown as IGroupKeyRepository;

    const groupRepository = { save: async (g: GroupRecord) => void groups.push(g) } as unknown as IGroupRepository;
    const ledgerSyncService = { sync: async () => { throw new Error('join never syncs'); } } as unknown as ILedgerSyncService;
    const chatStore = {
        getChat: async () => existing,
        create: async (c: Chat) => void chats.push(c),
    } as unknown as IChatStore;
    const userRepository = { get: async () => new User('u', 'bob', 'bob', null, 'Bob') } as unknown as IUserRepository;
    const mainWindow = { webContents: { send: vi.fn() } } as unknown as Electron.BrowserWindow;

    const sut = new GroupJoinService(
        groupKeyRepository,
        groupRepository,
        ledgerSyncService,
        chatStore,
        userRepository,
        mainWindow,
    );

    return { sut, epochKeys, writeKeys, chats, groups, mainWindow };
}

describe('joining a group from GroupCreated', () => {
    test('builds the whole group without asking the sender for anything', async () => {
        const writeKey = generateWriteKeyPair();
        const h = harness();

        await h.sut.join(payload('bob', writeKey.privateKey), 'alice-device');

        expect(h.epochKeys[0].epoch).toBe(1);
        expect(h.epochKeys[0].key).toEqual(EPOCH_KEY);
        expect(h.writeKeys[0].privateKey).toEqual(writeKey.privateKey);
        expect(h.writeKeys[0].publicKey).toEqual(publicKeyFromPrivate(writeKey.privateKey));
        expect(h.chats[0].isGroup).toBe(true);
        expect(h.chats[0].groupName).toBe('Trip');
        expect(h.groups[0].lifecycle).toBe(GroupLifecycle.Active);
    });

    test('keeps the other members and their devices, leaving itself out of the member list', async () => {
        const h = harness();

        await h.sut.join(payload(), 'alice-device');

        expect(h.chats[0].members.map((m) => m.userTag)).toEqual(['alice']);
        expect(h.chats[0].members[0].devices).toEqual(['alice-device']);
    });

    test('ignores a group it was not listed in', async () => {
        const h = harness();

        await h.sut.join(payload('carol'), 'alice-device');

        expect(h.chats).toEqual([]);
        expect(h.writeKeys).toEqual([]);
    });

    test('ignores a second copy of a group it already holds', async () => {
        const h = harness(new Chat(GROUP_ID, [], [], 0, false, GROUP_ID));

        await h.sut.join(payload(), 'alice-device');

        expect(h.chats).toEqual([]);
        expect(h.writeKeys).toEqual([]);
    });
});
