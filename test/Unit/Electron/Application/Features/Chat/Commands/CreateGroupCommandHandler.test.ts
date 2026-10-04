import { describe, expect, test } from 'vitest';
import { CreateGroupCommandHandler } from '../../../../../../../src/Electron/Application/Features/Chat/Commands/CreateGroupCommandHandler.js';
import { CreateGroupCommand } from '../../../../../../../src/Electron/Application/Features/Chat/Contracts/CreateGroup.js';
import { IChatStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { IFriendRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IFriendRepository.js';
import { IGroupKeyRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { Chat } from '../../../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { Friend } from '../../../../../../../src/Electron/Domain/Aggregates/Friend.js';
import { FriendConnectionId } from '../../../../../../../src/Electron/Domain/Entities/FriendConnectionId.js';
import { GroupRecord } from '../../../../../../../src/Electron/Domain/Entities/GroupRecord.js';
import { GroupEpochKey } from '../../../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import { GroupLifecycle } from '../../../../../../../src/Electron/Domain/Enums/GroupLifecycle.js';
import { ChatPrivileges } from '../../../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function friend(tag: string): Friend {
    const f = new Friend();
    f.id = tag;
    f.username = tag;
    f.displayName = tag.toUpperCase();
    f.avatarKey = null;
    f.connectionIds = [new FriendConnectionId(`${tag}-device`, f)];
    return f;
}

function harness(friends: Record<string, Friend> = { bob: friend('bob'), carol: friend('carol') }) {
    const chats: Chat[] = [];
    const groups: GroupRecord[] = [];
    const writeKeys: GroupWriteKey[] = [];
    const epochKeys: GroupEpochKey[] = [];

    const chatStore = { create: async (chat: Chat) => void chats.push(chat) } as unknown as IChatStore;
    const friendRepository = { getById: async (id: string) => friends[id] ?? null } as unknown as IFriendRepository;
    const groupKeyRepository = {
        saveWriteKey: async (key: GroupWriteKey) => void writeKeys.push(key),
        saveEpochKey: async (key: GroupEpochKey) => void epochKeys.push(key),
    } as unknown as IGroupKeyRepository;
    const groupRepository = { save: async (group: GroupRecord) => void groups.push(group) } as unknown as IGroupRepository;

    return {
        sut: new CreateGroupCommandHandler(chatStore, friendRepository, groupKeyRepository, groupRepository),
        chats,
        groups,
        writeKeys,
        epochKeys,
    };
}

describe('creating a group', () => {
    test('stores a group chat with the chosen members', async () => {
        const h = harness();

        const result = await h.sut.handle(new CreateGroupCommand(GROUP_ID, 'Trip', ['bob', 'carol']));

        expect(result.success).toBe(true);
        expect(h.chats[0].isGroup).toBe(true);
        expect(h.chats[0].groupName).toBe('Trip');
        expect(h.chats[0].members.map((m) => m.userTag).sort()).toEqual(['bob', 'carol']);
        expect(h.chats[0].members.every((m) => m.privilege === ChatPrivileges.Member)).toBe(true);
    });

    test('generates the group keys up front', async () => {
        const h = harness();

        await h.sut.handle(new CreateGroupCommand(GROUP_ID, 'Trip', ['bob']));

        expect(h.writeKeys[0].publicKey).toHaveLength(32);
        expect(h.writeKeys[0].privateKey).toHaveLength(32);
        expect(h.epochKeys[0].epoch).toBe(1);
        expect(h.epochKeys[0].key).toHaveLength(32);
    });

    test('leaves the group as a draft, so nothing is written to the ledger yet', async () => {
        const h = harness();

        await h.sut.handle(new CreateGroupCommand(GROUP_ID, 'Trip', ['bob']));

        expect(h.groups[0].lifecycle).toBe(GroupLifecycle.Draft);
        expect(h.groups[0].version).toBe(0);
    });

    test('refuses a group with nobody in it', async () => {
        const h = harness();

        const result = await h.sut.handle(new CreateGroupCommand(GROUP_ID, 'Trip', []));

        expect(result.success).toBe(false);
        expect(h.chats).toEqual([]);
    });

    test('refuses a member it cannot resolve', async () => {
        const h = harness();

        const result = await h.sut.handle(new CreateGroupCommand(GROUP_ID, 'Trip', ['bob', 'stranger']));

        expect(result.success).toBe(false);
        expect(result.errorMessage?.message).toContain('stranger');
        expect(h.chats).toEqual([]);
    });
});
