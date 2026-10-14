import { describe, expect, test, vi } from 'vitest';
import { ResendMessageCommandHandler } from '../../../../../../../src/Electron/Application/Features/Chat/Commands/ResendMessageCommandHandler.js';
import { ResendMessageCommand } from '../../../../../../../src/Shared/Chat/ResendMessage.js';
import { IEventRepository } from '../../../../../../../src/Electron/Application/Contracts/Providers/IEventRepository.js';
import { IChatStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IMediaStore.js';
import { IPump } from '../../../../../../../src/Electron/Application/Contracts/Services/IPump.js';
import { Message } from '../../../../../../../src/Electron/Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../../../../../src/Shared/Enums/DeliveryStatus.js';
import { MessageSentEvent } from '../../../../../../../src/Electron/Domain/Events/MessageSentEvent.js';

function createHandler(overrides: { chatStore?: Partial<IChatStore> } = {}) {
    const eventRepository: IEventRepository = {
        appendEvent: vi.fn().mockResolvedValue(undefined),
    };

    const chatStore = {
        getMessage: vi.fn(),
        ...overrides.chatStore,
    } as unknown as IChatStore;

    const messagePump: IPump = {
        notify: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    };

    const mediaStore: IMediaStore = {
        store: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
    };

    const handler = new ResendMessageCommandHandler(eventRepository, chatStore, messagePump, mediaStore);

    return { handler, eventRepository, chatStore, messagePump, mediaStore };
}

function createFailedMessage(): Message {
    return new Message('msg-1', 'chat-1', 'sender-1', new Date(), 'hello', null, DeliveryStatus.Failed, 'token-1');
}

describe('ResendMessageCommandHandler', () => {
    test('fails when the message does not exist', async () => {
        const { handler, chatStore, eventRepository, messagePump } = createHandler();
        (chatStore.getMessage as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1', [], []));

        expect(result.success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(messagePump.notify).not.toHaveBeenCalled();
    });

    test('fails when the message is not in a failed state', async () => {
        const { handler, chatStore, eventRepository, messagePump } = createHandler();
        const message = createFailedMessage();
        message.deliveryStatus = DeliveryStatus.Sent;
        (chatStore.getMessage as ReturnType<typeof vi.fn>).mockResolvedValue(message);

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1', [], []));

        expect(result.success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(messagePump.notify).not.toHaveBeenCalled();
    });

    test('appends a MessageSentEvent with status reset to Pending and notifies the pump', async () => {
        const { handler, chatStore, eventRepository, messagePump } = createHandler();
        (chatStore.getMessage as ReturnType<typeof vi.fn>).mockResolvedValue(createFailedMessage());

        const result = await handler.handle(
            new ResendMessageCommand('chat-1', 'msg-1', ['conn-1'], ['participant-1']),
        );

        expect(result.success).toBe(true);
        expect(eventRepository.appendEvent).toHaveBeenCalledTimes(1);

        const appendedEvent = (eventRepository.appendEvent as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as MessageSentEvent;
        expect(appendedEvent.message.id).toBe('msg-1');
        expect(appendedEvent.message.deliveryStatus).toBe(DeliveryStatus.Pending);
        expect(appendedEvent.connectionIds).toEqual(['conn-1']);
        expect(appendedEvent.participants).toEqual(['participant-1']);

        expect(messagePump.notify).toHaveBeenCalledTimes(1);
    });
});
