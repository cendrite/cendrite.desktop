import { describe, expect, test, vi } from 'vitest';
import { SendMessageCommandHandler } from '#electron/Application/Features/Chat/Commands/SendMessageCommandHandler';
import { SendMessageCommand } from '#shared/Chat/SendMessage';
import { Message } from '#electron/Domain/Entities/Message';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';

function setup() {
    const stored: Message[] = [];
    const eventRepository = { appendEvent: vi.fn(async () => undefined) };
    const messagePump = { notify: vi.fn(), start: vi.fn(), stop: vi.fn() };

    const sut = new SendMessageCommandHandler(
        eventRepository as never,
        { storeMessage: vi.fn(async (message: Message) => { stored.push(message); }) } as never,
        { store: vi.fn() } as never,
        messagePump as never,
    );

    return { sut, stored, eventRepository, messagePump };
}

const command = () => new SendMessageCommand('chat-1', 'msg-1', 'alice-laptop', ['alice', 'bob'], ['bob-laptop'], 'hi', []);

describe('sending a message', () => {
    test('stores the message as pending and queues its event under the message id', async () => {
        const { sut, stored, eventRepository, messagePump } = setup();

        const result = await sut.handle(command());

        expect(result.data!.deliveryStatus).toBe(DeliveryStatus.Pending);
        expect(stored[0].deliveryStatus).toBe(DeliveryStatus.Pending);

        const [event] = eventRepository.appendEvent.mock.calls[0] as unknown as [MessageSentEvent];
        expect(event.id).toBe('msg-1');
        expect(event.connectionIds).toEqual(['bob-laptop']);
        expect(event.payloads).toEqual({});
        expect(messagePump.notify).toHaveBeenCalled();
    });
});
