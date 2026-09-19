import { describe, expect, test } from 'vitest';
import {
    parseEventContent,
    serializeEvent,
} from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/EventRepository.js';
import { MessageSentEvent } from '../../../../../../src/Electron/Domain/Events/MessageSentEvent.js';
import { MessageContract } from '../../../../../../src/Electron/Application/Contracts/Models/MessageContract.js';
import { MediaContract } from '../../../../../../src/Electron/Application/Contracts/Models/MediaContract.js';
import { DeliveryStatus } from '../../../../../../src/Electron/Domain/Enums/DeliveryStatus.js';

describe('EventRepository serialization', () => {
    test('media content survives the outbox round-trip as a Uint8Array', () => {
        const bytes = new Uint8Array([0, 1, 2, 127, 128, 255]);
        const message = new MessageContract(
            'msg-1',
            'chat-1',
            'sender-1',
            'hello',
            new Date(),
            [new MediaContract('media-1', 'image/png', bytes)],
            DeliveryStatus.Pending,
            'token',
        );
        const event = new MessageSentEvent('evt-1', message, ['conn-1'], ['user-1'], new Date());

        const parsed = parseEventContent(serializeEvent(event)) as any;
        const content = parsed.message.media[0].content;

        expect(content).toBeInstanceOf(Uint8Array);
        expect(Array.from(content)).toEqual(Array.from(bytes));
    });

    test('Node Buffers are also restored as Uint8Array', () => {
        const parsed = parseEventContent(JSON.stringify({})) as any;
        expect(parsed).toEqual({});

        const roundTripped = parseEventContent(serializeEvent({ data: Buffer.from([9, 8, 7]) } as any)) as any;
        expect(roundTripped.data).toBeInstanceOf(Uint8Array);
        expect(Array.from(roundTripped.data)).toEqual([9, 8, 7]);
    });

    test('events without binary data are unchanged', () => {
        const plain = { id: 'x', nested: { list: [1, 'two', null], flag: true } };
        expect(parseEventContent(serializeEvent(plain as any))).toEqual(plain);
    });
});
