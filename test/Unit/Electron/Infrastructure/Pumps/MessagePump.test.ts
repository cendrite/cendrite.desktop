import { describe, expect, test, vi } from 'vitest';
import { MessagePump } from '#electron/Infrastructure/Pumps/MessagePump';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { Group } from '#electron/Domain/Entities/Group';
import { Payload } from '#electron/Domain/Protocol/Payload';
import { MessageContract } from '#shared/Models/MessageContract';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';

const straps = { 'bob-laptop': [{ type: 6 }] as unknown as Payload[] };

function queued(payloads: Record<string, Payload[]> = {}): MessageSentEvent {
    return new MessageSentEvent(
        'msg-1',
        new MessageContract('msg-1', 'chat-1', 'alice-laptop', 'hi', new Date(1), [], DeliveryStatus.Pending, 'token-1'),
        ['bob-laptop'],
        ['alice', 'bob'],
        new Date(1),
        payloads,
    );
}

interface Setup {
    group?: boolean;
    startGroup?: Result<Record<string, Payload[]> | null>;
    send?: Result<DeliveryStatus>;
    message?: boolean;
}

function setup({ group = false, startGroup = Result.success(null), send = Result.success(DeliveryStatus.Sent), message = true }: Setup = {}) {
    const order: string[] = [];
    const eventRepository = {
        appendEvent: vi.fn(async (_event: MessageSentEvent) => void order.push('append')),
        markAsFailed: vi.fn(async (_id: string, _error: string) => undefined),
        deleteEvent: vi.fn(async (_id: string) => undefined),
    };
    const chatStore = {
        getMessage: vi.fn(async () => (message ? { id: 'msg-1', chatId: 'chat-1' } : null)),
        markMessage: vi.fn(async (_id: string, _status: DeliveryStatus) => undefined),
    };
    const mediator = {
        send: vi.fn(async (_command: { payloads: Record<string, Payload[]> }) => {
            order.push('send');
            return send;
        }),
    };
    const mainWindow = { webContents: { send: vi.fn() } };
    const groupService = { startGroup: vi.fn(async () => startGroup) };

    const sut = new MessagePump(
        chatStore as never,
        eventRepository as never,
        mediator as never,
        mainWindow as never,
        {} as never,
        { get: async () => (group ? new Group('chat-1') : null) } as never,
        groupService as never,
    );

    return { sut, eventRepository, chatStore, mediator, mainWindow, groupService, order };
}

describe('delivering a queued message', () => {
    test('sends the event and removes it from the outbox', async () => {
        const { sut, eventRepository, chatStore, groupService } = setup();

        await sut.deliver(queued());

        expect(groupService.startGroup).not.toHaveBeenCalled();
        expect(chatStore.markMessage).toHaveBeenCalledWith('msg-1', DeliveryStatus.Sent);
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('msg-1');
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
    });

    test('keeps the event as failed when the send fails', async () => {
        const { sut, eventRepository, chatStore } = setup({ send: Result.fail(new ErrorMessage(null, 'hub down')) });

        await sut.deliver(queued());

        expect(chatStore.markMessage).toHaveBeenCalledWith('msg-1', DeliveryStatus.Failed);
        expect(eventRepository.markAsFailed).toHaveBeenCalledWith('msg-1', 'hub down');
        expect(eventRepository.deleteEvent).not.toHaveBeenCalled();
    });

    test('keeps the event as failed when no device accepted it', async () => {
        const { sut, eventRepository } = setup({ send: Result.success(DeliveryStatus.Failed) });

        await sut.deliver(queued());

        expect(eventRepository.markAsFailed).toHaveBeenCalledWith('msg-1', 'No device accepted the message');
    });

    test('drops the event when its message is gone', async () => {
        const { sut, eventRepository, mediator } = setup({ message: false });

        await sut.deliver(queued());

        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('msg-1');
        expect(mediator.send).not.toHaveBeenCalled();
    });
});

describe('delivering a group message', () => {
    test('stores the straps of a group that starts now in the event before sending', async () => {
        const { sut, eventRepository, mediator, order } = setup({ group: true, startGroup: Result.success(straps) });

        await sut.deliver(queued());

        expect(eventRepository.appendEvent.mock.calls[0][0].id).toBe('msg-1');
        expect(eventRepository.appendEvent.mock.calls[0][0].payloads).toBe(straps);
        expect(mediator.send.mock.calls[0][0].payloads).toBe(straps);
        expect(order).toEqual(['append', 'send']);
    });

    test('sends the stored straps when the group had already started', async () => {
        const { sut, eventRepository, mediator } = setup({ group: true });

        await sut.deliver(queued(straps));

        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(mediator.send.mock.calls[0][0].payloads).toBe(straps);
    });

    test('keeps the event as failed without sending when the group cannot start', async () => {
        const { sut, eventRepository, chatStore, mediator, mainWindow } = setup({
            group: true,
            startGroup: Result.fail(new ErrorMessage('LedgerWriter', 'No private token')),
        });

        await sut.deliver(queued());

        expect(mediator.send).not.toHaveBeenCalled();
        expect(chatStore.markMessage).toHaveBeenCalledWith('msg-1', DeliveryStatus.Failed);
        expect(eventRepository.markAsFailed).toHaveBeenCalledWith('msg-1', 'No private token');
        expect(mainWindow.webContents.send).toHaveBeenCalledWith('eventMessage', {
            kind: 'deliveryStatus',
            chatId: 'chat-1',
            messageIds: ['msg-1'],
            status: DeliveryStatus.Failed,
        });
    });
});
