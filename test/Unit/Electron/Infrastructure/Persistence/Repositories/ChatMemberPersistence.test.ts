import { beforeAll, describe, expect, test, vi } from 'vitest';

vi.mock('../../../../../../src/Electron/Infrastructure/Persistence/Encryption/CryptographyService.js', () => ({
    CryptographyService: {
        getInstance: () => ({
            encrypt: async (value: string) => value,
            decrypt: async (value: string) => value,
        }),
    },
}));

import { initializeDatabase } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { ChatStore } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/ChatStore.js';
import { Chat } from '../../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../../../src/Electron/Domain/Entities/ChatMember.js';
import { ChatPrivileges } from '../../../../../../src/Shared/Enums/ChatPrivileges.js';

const CHAT_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const MEMBER_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e11';

beforeAll(async () => {
    await initializeDatabase(':memory:');
});

describe('storing a chat member privilege', () => {
    test('comes back as a number and follows a change', async () => {
        const store = new ChatStore();
        await store.create(new Chat(CHAT_ID, [ChatMember.createExternal(MEMBER_ID, ChatPrivileges.Member, 'bob', 'Bob', ['bob-device'])], [], 'Trip'));

        expect((await store.getChatWithMembers(CHAT_ID)).members[0].privilege).toBe(ChatPrivileges.Member);

        await store.setMemberPrivilege(MEMBER_ID, ChatPrivileges.Admin);

        expect((await store.getChatWithMembers(CHAT_ID)).members[0].privilege).toBe(ChatPrivileges.Admin);
    });
});
