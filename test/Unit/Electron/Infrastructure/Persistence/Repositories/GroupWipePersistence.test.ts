import { beforeAll, describe, expect, test, vi } from 'vitest';

vi.mock('../../../../../../src/Electron/Infrastructure/Persistence/Encryption/CryptographyService.js', () => ({
    CryptographyService: {
        getInstance: () => ({
            encrypt: async (value: string) => value,
            decrypt: async (value: string) => value,
        }),
    },
}));

import { getDbContext, initializeDatabase } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { ChatStore } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/ChatStore.js';
import { EventRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/EventRepository.js';
import { GroupKeyRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/GroupKeyRepository.js';
import { LedgerLogRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/LedgerLogRepository.js';
import { Chat } from '../../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../../../src/Electron/Domain/Entities/ChatMember.js';
import { Message } from '../../../../../../src/Electron/Domain/Entities/Message.js';
import { MessageMedia } from '../../../../../../src/Electron/Domain/Entities/MessageMedia.js';
import { LedgerEventRecord } from '../../../../../../src/Electron/Domain/Entities/LedgerEventRecord.js';
import { LedgerEventStatus } from '../../../../../../src/Electron/Domain/Enums/LedgerEventStatus.js';
import { GroupWriteKey } from '../../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import { GroupEpochKey } from '../../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';
import { PendingGroupWriteKey } from '../../../../../../src/Electron/Domain/Encryption/PendingGroupWriteKey.js';
import { GroupChangeEvent } from '../../../../../../src/Electron/Domain/Events/GroupChangeEvent.js';
import { MessageSentEvent } from '../../../../../../src/Electron/Domain/Events/MessageSentEvent.js';
import { MemberRemovedOperation } from '../../../../../../src/Electron/Domain/Protocol/LedgerOperation.js';
import { OutboxEvent } from '../../../../../../src/Electron/Infrastructure/Models/OutboxEvent.js';
import { MessageContract } from '../../../../../../src/Shared/Models/MessageContract.js';
import { ChatPrivileges } from '../../../../../../src/Shared/Enums/ChatPrivileges.js';
import { DeliveryStatus } from '../../../../../../src/Shared/Enums/DeliveryStatus.js';

const GROUP = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const OTHER = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e11';

function record(groupId: string) {
    return new LedgerEventRecord(groupId, 1, Buffer.alloc(32), Buffer.from([1]), Buffer.alloc(32, 1), Buffer.alloc(64, 2), Buffer.alloc(32, 3), [], [], [], [], LedgerEventStatus.Applied);
}

function sent(id: string, chatId: string) {
    return new MessageSentEvent(id, new MessageContract(id, chatId, 'sender', 'hi', new Date(1), [], DeliveryStatus.Pending, 'token'), ['device'], ['a', 'b'], new Date(1));
}

beforeAll(async () => {
    await initializeDatabase(':memory:');
});

describe('wiping one group from the local database', () => {
    test('removes its chat, media rows, outbox events, ledger log and keys, and leaves other groups alone', async () => {
        const chats = new ChatStore();
        const events = new EventRepository();
        const log = new LedgerLogRepository();
        const keys = new GroupKeyRepository();

        for (const [index, id] of [GROUP, OTHER].entries()) {
            await chats.create(new Chat(id, [ChatMember.createExternal(`0199673a-3c1e-7c2b-9f2e-5d8b1a4c7f1${index}`, ChatPrivileges.Member, 'bob', 'Bob', ['bob'])], [], 'Trip'));
            const messageId = `0199673a-3c1e-7c2b-9f2e-5d8b1a4c7f2${index}`;
            await chats.storeMessage(new Message(messageId, id, 'bob', new Date(), 'hi', [new MessageMedia(`0199673a-3c1e-7c2b-9f2e-5d8b1a4c7f3${index}`, 0 as never, messageId)], DeliveryStatus.Received, 'token'));
            await log.append([record(id)]);
            await keys.saveWriteKey(new GroupWriteKey(id, Buffer.alloc(32, 1), Buffer.alloc(32, 2)));
            await keys.savePendingWriteKey(new PendingGroupWriteKey(id, Buffer.alloc(32, 3), Buffer.alloc(32, 4)));
            await keys.saveEpochKey(new GroupEpochKey(id, 1, Buffer.alloc(32, 5)));
            await events.appendEvent(sent(`sent-${index}`, id));
            await events.appendEvent(new GroupChangeEvent(`change-${index}`, id, new MemberRemovedOperation('alice', 'bob'), {}, new Date(1)));
        }
        await events.markAsFailed('sent-0', 'failed');

        expect(await chats.getMediaIds(GROUP)).toEqual(['0199673a-3c1e-7c2b-9f2e-5d8b1a4c7f30']);

        await chats.deleteChat(GROUP);
        await events.deleteForGroup(GROUP);
        await log.deleteForGroup(GROUP);
        await keys.deleteForGroup(GROUP);

        expect(await chats.getChat(GROUP)).toBeNull();
        expect(await chats.getMediaIds(GROUP)).toEqual([]);
        expect(await log.getAll(GROUP)).toEqual([]);
        expect(await keys.getWriteKey(GROUP)).toBeNull();
        expect(await keys.getPendingWriteKey(GROUP)).toBeNull();
        expect(await keys.getEpochKeys(GROUP)).toEqual([]);

        const remaining = await getDbContext().getRepository(OutboxEvent).find();
        expect(remaining.map((event) => event.id).sort()).toEqual(['change-1', 'sent-1']);

        expect(await chats.getChat(OTHER)).not.toBeNull();
        expect(await chats.getMediaIds(OTHER)).toHaveLength(1);
        expect(await log.getAll(OTHER)).toHaveLength(1);
        expect(await keys.getWriteKey(OTHER)).not.toBeNull();
        expect(await keys.getEpochKeys(OTHER)).toHaveLength(1);
    });
});
