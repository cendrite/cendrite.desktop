import { describe, expect, test, vi } from 'vitest';
import { MessagePump } from '#electron/Infrastructure/Pumps/MessagePump';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupChangeEvent } from '#electron/Domain/Events/GroupChangeEvent';
import { MemberAddedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { GroupStrapPayload, Payload } from '#electron/Domain/Protocol/Payload';
import { MessageContract } from '#shared/Models/MessageContract';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';

const strap = { type: 6, inviteKeyPrivate: 'k1' } as unknown as GroupStrapPayload;
const straps = { 'bob-laptop': strap };
const strapPayloads = { 'bob-laptop': [strap] as Payload[] };

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
    startGroup?: Result<Record<string, GroupStrapPayload> | null>;
    send?: Result<DeliveryStatus>;
    message?: boolean;
}

function setup({ group = false, startGroup = Result.success(null), send = Result.success(DeliveryStatus.Sent), message = true }: Setup = {}) {
    const order: string[] = [];
    const eventRepository = {
        appendEvent: vi.fn(async (_event: MessageSentEvent) => void order.push('append')),
        markAsFailed: vi.fn(async (_id: string, _error: string) => undefined),
        deleteEvent: vi.fn(async (_id: string) => undefined),
        getEvents: vi.fn(async (): Promise<GroupChangeEvent[]> => []),
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
    const groupService = {
        startGroup: vi.fn(async () => startGroup),
        deliverChange: vi.fn(async (_change: GroupChangeEvent) => true),
    };

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
        expect(eventRepository.appendEvent.mock.calls[0][0].payloads).toEqual(strapPayloads);
        expect(mediator.send.mock.calls[0][0].payloads).toEqual(strapPayloads);
        expect(order).toEqual(['append', 'send']);
    });

    test('sends the stored straps when the group had already started', async () => {
        const { sut, eventRepository, mediator } = setup({ group: true });

        await sut.deliver(queued(strapPayloads));

        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(mediator.send.mock.calls[0][0].payloads).toBe(strapPayloads);
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

describe('delivering queued group changes', () => {
    const change = (id: string, groupId: string) => new GroupChangeEvent(id, groupId, {} as MemberAddedOperation, {}, new Date(1));

    test('delivers the oldest change of a group first and never skips ahead in it', async () => {
        const { sut, eventRepository, groupService } = setup();
        eventRepository.getEvents.mockResolvedValue([change('first', 'group-a'), change('second', 'group-a')]);
        groupService.deliverChange.mockResolvedValue(false);

        await sut.deliverNextChange();

        expect(groupService.deliverChange).toHaveBeenCalledOnce();
        expect(groupService.deliverChange.mock.calls[0][0].id).toBe('first');
    });

    test('a waiting group does not block another group', async () => {
        const { sut, eventRepository, groupService } = setup();
        eventRepository.getEvents.mockResolvedValue([change('waiting', 'group-a'), change('ready', 'group-b')]);
        groupService.deliverChange.mockImplementation(async (event) => event.groupId === 'group-b');

        expect(await sut.deliverNextChange()).toBe(true);

        expect(groupService.deliverChange.mock.calls.map(([event]) => event.id)).toEqual(['waiting', 'ready']);
    });

    test('waits before trying a failed group again', async () => {
        const { sut, eventRepository, groupService } = setup();
        eventRepository.getEvents.mockResolvedValue([change('waiting', 'group-a')]);
        groupService.deliverChange.mockResolvedValue(false);

        await sut.deliverNextChange();
        await sut.deliverNextChange();

        expect(groupService.deliverChange).toHaveBeenCalledOnce();
    });

    test('a change that throws does not stop the pump', async () => {
        const { sut, eventRepository, groupService } = setup();
        eventRepository.getEvents.mockResolvedValue([change('broken', 'group-a')]);
        groupService.deliverChange.mockRejectedValue(new Error('boom'));

        await expect(sut.deliverNextChange()).resolves.toBe(false);
    });

    test('retries a waiting change as soon as its group starts', async () => {
        const { sut, eventRepository, groupService } = setup({ group: true, startGroup: Result.success(straps) });
        eventRepository.getEvents.mockResolvedValue([change('waiting', 'chat-1')]);
        groupService.deliverChange.mockResolvedValueOnce(false);

        await sut.deliverNextChange();
        await sut.deliver(queued());
        await sut.deliverNextChange();

        expect(groupService.deliverChange).toHaveBeenCalledTimes(2);
    });
});
