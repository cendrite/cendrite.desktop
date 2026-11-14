import { describe, expect, test, vi } from 'vitest';
import { SendMessageCommandHandler } from '#electron/Application/Features/Chat/Commands/SendMessageCommandHandler';
import { SendMessageCommand } from '#shared/Chat/SendMessage';
import { Message } from '#electron/Domain/Entities/Message';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { Payload } from '#electron/Domain/Protocol/Payload';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';

function setup(startGroup: () => Promise<Result<Record<string, Payload[]> | null>>) {
    const stored: Message[] = [];
    const eventRepository = { appendEvent: vi.fn(async () => undefined) };
    const messagePump = { notify: vi.fn(), start: vi.fn(), stop: vi.fn() };

    const sut = new SendMessageCommandHandler(
        eventRepository as never,
        { storeMessage: vi.fn(async (message: Message) => { stored.push(message); }) } as never,
        { store: vi.fn() } as never,
        messagePump as never,
        { createGroup: vi.fn(), startGroup: vi.fn(startGroup) } as never,
    );

    return { sut, stored, eventRepository, messagePump };
}

const groupMessage = () => new SendMessageCommand('chat-1', 'msg-1', 'alice-laptop', ['alice', 'bob'], ['bob-laptop'], 'hi', [], true);

describe('sending a group message', () => {
    test('stores the message as failed and sends nothing when the group cannot start', async () => {
        const { sut, stored, eventRepository, messagePump } = setup(async () =>
            Result.fail<Record<string, Payload[]> | null>(new ErrorMessage('LedgerWriter', 'No private token')),
        );

        const result = await sut.handle(groupMessage());

        expect(result.success).toBe(true);
        expect(result.data!.deliveryStatus).toBe(DeliveryStatus.Failed);
        expect(stored[0].deliveryStatus).toBe(DeliveryStatus.Failed);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(messagePump.notify).not.toHaveBeenCalled();
    });

    test('sends the straps with the first message of a group', async () => {
        const straps = { 'bob-laptop': [] as Payload[] };
        const { sut, stored, eventRepository, messagePump } = setup(async () =>
            Result.success<Record<string, Payload[]> | null>(straps),
        );

        const result = await sut.handle(groupMessage());

        expect(result.data!.deliveryStatus).toBe(DeliveryStatus.Pending);
        expect(stored[0].deliveryStatus).toBe(DeliveryStatus.Pending);

        const [event] = eventRepository.appendEvent.mock.calls[0] as unknown as [MessageSentEvent];
        expect(event.payloads).toBe(straps);
        expect(messagePump.notify).toHaveBeenCalled();
    });
});
