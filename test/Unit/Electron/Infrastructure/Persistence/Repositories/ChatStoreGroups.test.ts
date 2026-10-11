import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { getDbContext, initializeDatabase } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { ChatStore } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/ChatStore.js';
import { Chat } from '../../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../../../src/Electron/Domain/Entities/ChatMember.js';
import { Friend } from '../../../../../../src/Electron/Domain/Aggregates/Friend.js';
import { FriendConnectionId } from '../../../../../../src/Electron/Domain/Entities/FriendConnectionId.js';
import { ChatPrivileges } from '../../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

beforeAll(async () => {
    await initializeDatabase(':memory:');
});

beforeEach(async () => {
    await new ChatStore().clear();
    await getDbContext().getRepository(Friend).clear();
});

async function loadChatWithMembers(chatId: string): Promise<Chat | null> {
    return getDbContext().getRepository(Chat).findOne({ where: { id: chatId }, relations: { members: true } });
}

async function storeFriend(id: string): Promise<Friend> {
    const friend = new Friend();
    friend.id = id;
    friend.username = id;
    friend.displayName = id;
    friend.avatarKey = null;
    friend.connectionIds = [];

    const saved = await getDbContext().getRepository(Friend).save(friend);
    saved.connectionIds = [await getDbContext().getRepository(FriendConnectionId).save(new FriendConnectionId(`${id}-device`, saved))];

    return saved;
}

describe('a group chat', () => {
    test('stores a member who is not a friend', async () => {
        const sut = new ChatStore();
        const external = ChatMember.createExternal('m1', ChatPrivileges.Member, 'carol', 'Carol', ['carol-device']);

        await sut.create(new Chat(GROUP_ID, [external], [], 'Trip'));

        const stored = await loadChatWithMembers(GROUP_ID);
        const member = stored!.members[0];

        expect(member.friend).toBeNull();
        expect(member.userTag).toBe('carol');
        expect(member.devices).toEqual(['carol-device']);
    });

    test('survives deleting a friend who is in it', async () => {
        const sut = new ChatStore();
        const friend = await storeFriend('bob');
        await sut.create(
            new Chat(GROUP_ID, [ChatMember.create('m1', ChatPrivileges.Member, friend)], [], 'Trip'),
        );

        await sut.deleteByFriendId('bob');

        const stored = await loadChatWithMembers(GROUP_ID);
        expect(stored).not.toBeNull();
        expect(stored!.members[0].userTag).toBe('bob');
    });

    test('keeps the member row when the friend row is deleted', async () => {
        const sut = new ChatStore();
        const friend = await storeFriend('bob');
        await sut.create(
            new Chat(GROUP_ID, [ChatMember.create('m1', ChatPrivileges.Member, friend)], [], 'Trip'),
        );

        await getDbContext().getRepository(Friend).delete('bob');

        const member = await getDbContext().getRepository(ChatMember).findOneBy({ id: 'm1' });
        expect(member).not.toBeNull();
        expect(member!.friend).toBeNull();
        expect(member!.userTag).toBe('bob');
    });
});

describe('a one to one chat', () => {
    test('is still deleted with its friend', async () => {
        const sut = new ChatStore();
        const friend = await storeFriend('bob');
        await sut.create(new Chat('dm-1', [ChatMember.create('m2', ChatPrivileges.Member, friend)], []));

        await sut.deleteByFriendId('bob');

        expect(await sut.getChat('dm-1')).toBeNull();
    });
});
