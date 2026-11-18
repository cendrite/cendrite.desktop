import { describe, expect, test, vi } from 'vitest';
import { ResendMessageCommandHandler } from '../../../../../../../src/Electron/Application/Features/Chat/Commands/ResendMessageCommandHandler.js';
import { ResendMessageCommand } from '../../../../../../../src/Shared/Chat/ResendMessage.js';
import { IChatStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { IPump } from '../../../../../../../src/Electron/Application/Contracts/Services/IPump.js';
import { Message } from '../../../../../../../src/Electron/Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../../../../../src/Shared/Enums/DeliveryStatus.js';
import { MessageSentEvent } from '../../../../../../../src/Electron/Domain/Events/MessageSentEvent.js';
import { MessageContract } from '../../../../../../../src/Shared/Models/MessageContract.js';
import { IGroupRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { IGroupService } from '../../../../../../../src/Electron/Application/Services/GroupService.js';
import { Group } from '../../../../../../../src/Electron/Domain/Entities/Group.js';
import { Payload } from '../../../../../../../src/Electron/Domain/Protocol/Payload.js';
import { Result } from '../../../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../../../src/Shared/Result/ErrorMessage.js';

const storedStraps = { 'bob-laptop': [{ type: 6 }] as unknown as Payload[] };

function storedEvent(payloads: Record<string, Payload[]> = {}): MessageSentEvent {
    return new MessageSentEvent(
        'msg-1',
        new MessageContract('msg-1', 'chat-1', 'sender-1', 'hello', new Date(1), [], DeliveryStatus.Failed, 'token-1'),
        ['bob-laptop', 'alice-phone'],
        ['alice', 'bob'],
        new Date(1),
        payloads,
    );
}

function createHandler(
    overrides: {
        event?: MessageSentEvent | null;
        group?: boolean;
        startGroup?: () => Promise<Result<Record<string, Payload[]> | null>>;
    } = {},
) {
    const eventRepository = {
        appendEvent: vi.fn().mockResolvedValue(undefined),
        getEventById: vi.fn().mockResolvedValue(overrides.event === undefined ? storedEvent() : overrides.event),
        markAsFailed: vi.fn().mockResolvedValue(undefined),
    };

    const chatStore = {
        getMessage: vi.fn().mockResolvedValue(createFailedMessage()),
    } as unknown as IChatStore;

    const messagePump: IPump = {
        notify: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    };

    const groupRepository = {
        get: vi.fn().mockResolvedValue(overrides.group ? new Group('chat-1') : null),
    } as unknown as IGroupRepository;

    const groupService = {
        createGroup: vi.fn(),
        startGroup: vi.fn(overrides.startGroup ?? (async () => Result.success<Record<string, Payload[]> | null>(null))),
    } as unknown as IGroupService;

    const handler = new ResendMessageCommandHandler(eventRepository, chatStore, messagePump, groupRepository, groupService);

    return { handler, eventRepository, chatStore, messagePump, groupService };
}

function createFailedMessage(): Message {
    return new Message('msg-1', 'chat-1', 'sender-1', new Date(), 'hello', null, DeliveryStatus.Failed, 'token-1');
}

function appended(eventRepository: { appendEvent: ReturnType<typeof vi.fn> }): MessageSentEvent {
    return eventRepository.appendEvent.mock.calls[0][0] as MessageSentEvent;
}

describe('ResendMessageCommandHandler', () => {
    test('fails when the message does not exist', async () => {
        const { handler, chatStore, eventRepository, messagePump } = createHandler();
        (chatStore.getMessage as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1'));

        expect(result.success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(messagePump.notify).not.toHaveBeenCalled();
    });

    test('fails when the message is not in a failed state', async () => {
        const { handler, chatStore, eventRepository, messagePump } = createHandler();
        const message = createFailedMessage();
        message.deliveryStatus = DeliveryStatus.Sent;
        (chatStore.getMessage as ReturnType<typeof vi.fn>).mockResolvedValue(message);

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1'));

        expect(result.success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(messagePump.notify).not.toHaveBeenCalled();
    });

    test('fails when the message has no stored event', async () => {
        const { handler, eventRepository, messagePump } = createHandler({ event: null });

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1'));

        expect(result.success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(messagePump.notify).not.toHaveBeenCalled();
    });

    test('queues the stored event again as pending and notifies the pump', async () => {
        const { handler, eventRepository, messagePump } = createHandler();

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1'));

        expect(result.success).toBe(true);
        expect(eventRepository.getEventById).toHaveBeenCalledWith('msg-1');

        const event = appended(eventRepository);
        expect(event.id).toBe('msg-1');
        expect(event.message.text).toBe('hello');
        expect(event.message.deliveryStatus).toBe(DeliveryStatus.Pending);
        expect(event.connectionIds).toEqual(['bob-laptop', 'alice-phone']);
        expect(event.participants).toEqual(['alice', 'bob']);
        expect(messagePump.notify).toHaveBeenCalledTimes(1);
    });

    test('keeps the stored straps when the group had already started', async () => {
        const { handler, eventRepository } = createHandler({ event: storedEvent(storedStraps), group: true });

        await handler.handle(new ResendMessageCommand('chat-1', 'msg-1'));

        expect(appended(eventRepository).payloads).toBe(storedStraps);
    });

    test('sends the straps of a group that only starts now', async () => {
        const straps = { 'bob-laptop': [] as Payload[] };
        const { handler, eventRepository, groupService } = createHandler({
            group: true,
            startGroup: async () => Result.success<Record<string, Payload[]> | null>(straps),
        });

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1'));

        expect(result.success).toBe(true);
        expect(groupService.startGroup).toHaveBeenCalledWith('chat-1');
        expect(appended(eventRepository).payloads).toBe(straps);
    });

    test('fails without sending when the group still cannot start', async () => {
        const { handler, eventRepository, messagePump } = createHandler({
            group: true,
            startGroup: async () => Result.fail<Record<string, Payload[]> | null>(new ErrorMessage('LedgerWriter', 'No private token')),
        });

        const result = await handler.handle(new ResendMessageCommand('chat-1', 'msg-1'));

        expect(result.success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(messagePump.notify).not.toHaveBeenCalled();
    });
});
