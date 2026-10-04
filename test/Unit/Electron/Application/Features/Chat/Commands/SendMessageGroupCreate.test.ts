import { describe, expect, test } from 'vitest';
import { SendMessageCommandHandler } from '../../../../../../../src/Electron/Application/Features/Chat/Commands/SendMessageCommandHandler.js';
import { SendMessageCommand } from '../../../../../../../src/Electron/Application/Features/Chat/Contracts/SendMessage.js';
import { IChatStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { IGroupRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IUserRepository.js';
import { IEventRepository } from '../../../../../../../src/Electron/Application/Contracts/Providers/IEventRepository.js';
import { IMediaStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IMediaStore.js';
import { IPump } from '../../../../../../../src/Electron/Application/Contracts/Services/IPump.js';
import { ILedgerIdentity } from '../../../../../../../src/Electron/Infrastructure/Interfaces/ILedgerIdentity.js';
import { Chat } from '../../../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { GroupRecord } from '../../../../../../../src/Electron/Domain/Entities/GroupRecord.js';
import { GroupLifecycle } from '../../../../../../../src/Electron/Domain/Enums/GroupLifecycle.js';
import { LedgerOperationType } from '../../../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { LedgerOperationQueuedEvent } from '../../../../../../../src/Electron/Domain/Events/LedgerOperationQueuedEvent.js';
import { MessageSentEvent } from '../../../../../../../src/Electron/Domain/Events/MessageSentEvent.js';
import { DomainEvent } from '../../../../../../../src/Electron/Domain/Events/IDomainEvent.js';
import { User } from '../../../../../../../src/Electron/Domain/Aggregates/User.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function groupChat(): Chat {
    const chat = new Chat(GROUP_ID, [], [], 0, false, GROUP_ID);
    chat.groupName = 'Trip';
    return chat;
}

function harness(chat: Chat | null, group: GroupRecord | null) {
    const appended: DomainEvent[] = [];
    const savedGroups: GroupRecord[] = [];
    const notified: string[] = [];

    const eventRepository = { appendEvent: async (e: DomainEvent) => void appended.push(e) } as IEventRepository;
    const chatStore = {
        storeMessage: async () => undefined,
        getChat: async () => chat,
    } as unknown as IChatStore;
    const mediaStore = { store: async () => undefined } as unknown as IMediaStore;
    const messagePump = { notify: () => notified.push('message'), start: () => {}, stop: () => {} } as IPump;
    const ledgerPump = { notify: () => notified.push('ledger'), start: () => {}, stop: () => {} } as IPump;
    const groupRepository = {
        get: async () => group,
        save: async (g: GroupRecord) => void savedGroups.push(g),
    } as unknown as IGroupRepository;
    const userRepository = {
        get: async () => new User('user-1', 'alice', 'alice', 'Alice'),
    } as unknown as IUserRepository;
    const ledgerIdentity = {
        publicKey: async () => Buffer.alloc(33, 0x05),
        sign: async () => Buffer.alloc(64),
        verify: () => true,
    } as ILedgerIdentity;

    const sut = new SendMessageCommandHandler(
        eventRepository,
        chatStore,
        mediaStore,
        messagePump,
        groupRepository,
        userRepository,
        ledgerIdentity,
        ledgerPump,
    );

    return { sut, appended, savedGroups, notified };
}

function command(): SendMessageCommand {
    return new SendMessageCommand(GROUP_ID, 'msg-1', 'conn-1', ['alice', 'bob'], ['conn-2'], 'hello', []);
}

describe('sending the first message to a group', () => {
    test('queues the stream creation and moves the group out of draft', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Draft));

        await h.sut.handle(command());

        const queued = h.appended.find((e) => e instanceof LedgerOperationQueuedEvent) as LedgerOperationQueuedEvent;
        expect(queued.createsStream).toBe(true);
        expect(queued.operation.type).toBe(LedgerOperationType.GroupCreated);
        expect(h.savedGroups[0].lifecycle).toBe(GroupLifecycle.Creating);
        expect(h.notified).toContain('ledger');
    });

    test('names the sender as owner, with their identity key pinned', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Draft));

        await h.sut.handle(command());

        const queued = h.appended.find((e) => e instanceof LedgerOperationQueuedEvent) as LedgerOperationQueuedEvent;
        const operation = queued.operation as { owner: { userTag: string; identityKey: string } };

        expect(operation.owner.userTag).toBe('alice');
        expect(operation.owner.identityKey).toBe(Buffer.alloc(33, 0x05).toString('base64'));
    });

    test('still queues the message itself', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Draft));

        await h.sut.handle(command());

        expect(h.appended.some((e) => e instanceof MessageSentEvent)).toBe(true);
        expect(h.notified).toContain('message');
    });
});

describe('later messages', () => {
    test('do not queue a second creation once the group is past draft', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Active));

        await h.sut.handle(command());

        expect(h.appended.some((e) => e instanceof LedgerOperationQueuedEvent)).toBe(false);
        expect(h.savedGroups).toEqual([]);
    });

    test('leave one to one chats untouched', async () => {
        const h = harness(new Chat('dm-1', [], []), null);

        await h.sut.handle(command());

        expect(h.appended.some((e) => e instanceof LedgerOperationQueuedEvent)).toBe(false);
        expect(h.notified).toEqual(['message']);
    });
});
