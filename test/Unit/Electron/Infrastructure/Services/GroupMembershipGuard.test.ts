import { describe, expect, test } from 'vitest';
import { GroupMembershipGuard } from '../../../../../src/Electron/Infrastructure/Services/GroupMembershipGuard.js';
import { IChatStore } from '../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { Chat } from '../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../../src/Electron/Domain/Entities/ChatMember.js';
import { ChatPrivileges } from '../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function guard(members: { tag: string; devices: string[] }[] | null) {
    const chatStore = {
        getChatWithMembers: async () => {
            if (!members) return null;

            const chatMembers = members.map((member, index) =>
                ChatMember.createExternal(`m${index}`, ChatPrivileges.Member, member.tag, member.tag, member.devices),
            );

            return new Chat(GROUP_ID, chatMembers, [], 0, false, GROUP_ID);
        },
    } as unknown as IChatStore;

    return new GroupMembershipGuard(chatStore);
}

describe('the membership guard', () => {
    test('accepts a device the group lists', async () => {
        const sut = guard([{ tag: 'bob', devices: ['bob-device'] }]);

        expect(await sut.isMember(GROUP_ID, 'bob-device')).toBe(true);
    });

    test('rejects a device belonging to nobody in the group', async () => {
        const sut = guard([{ tag: 'bob', devices: ['bob-device'] }]);

        expect(await sut.isMember(GROUP_ID, 'stranger-device')).toBe(false);
    });

    test('rejects everyone when the group is not held locally', async () => {
        const sut = guard(null);

        expect(await sut.isMember(GROUP_ID, 'bob-device')).toBe(false);
    });
});
