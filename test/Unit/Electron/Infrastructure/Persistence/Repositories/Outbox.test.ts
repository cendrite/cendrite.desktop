import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

// CryptographyService loads keytar, a native binding to the OS keyring that does not exist on CI.
vi.mock('../../../../../../src/Electron/Infrastructure/Persistence/Encryption/CryptographyService.js', () => ({
    CryptographyService: {
        getInstance: () => ({
            encrypt: async (value: string) => `sealed:${value}`,
            decrypt: async (value: string) => value.replace(/^sealed:/, ''),
        }),
    },
}));

import { initializeDatabase, getDbContext } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { EventRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/EventRepository.js';
import { OutboxEvent } from '../../../../../../src/Electron/Infrastructure/Models/OutboxEvent.js';
import { EnvelopeQueuedEvent } from '../../../../../../src/Electron/Domain/Events/EnvelopeQueuedEvent.js';
import { LedgerOperationQueuedEvent } from '../../../../../../src/Electron/Domain/Events/LedgerOperationQueuedEvent.js';
import { MessageSentEvent } from '../../../../../../src/Electron/Domain/Events/MessageSentEvent.js';
import { MessageContract } from '../../../../../../src/Electron/Application/Contracts/Models/MessageContract.js';
import { PayloadType } from '../../../../../../src/Electron/Application/Contracts/Messaging/Envelope.js';
import { DeliveryStatus } from '../../../../../../src/Electron/Domain/Enums/DeliveryStatus.js';
import { LedgerOperationType } from '../../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

const operation = {
    type: LedgerOperationType.GroupCreated as const,
    authorTag: 'alice',
    at: 1,
    name: 'Trip',
    members: [],
};

beforeAll(async () => {
    await initializeDatabase(':memory:');
});

beforeEach(async () => {
    await getDbContext().getRepository(OutboxEvent).clear();
});

function message(): MessageContract {
    return new MessageContract('msg-1', GROUP_ID, 'conn-1', 'hello', new Date(), [], DeliveryStatus.Pending, 'token');
}

describe('draining the outbox', () => {
    test('gives back an event with its fields intact', async () => {
        const sut = new EventRepository();
        await sut.appendEvent(new LedgerOperationQueuedEvent('e1', GROUP_ID, operation, true, new Date()));

        const next = (await sut.getNext()) as LedgerOperationQueuedEvent;

        expect(next.id).toBe('e1');
        expect(next.groupId).toBe(GROUP_ID);
        expect(next.createsStream).toBe(true);
        expect(next.operation.type).toBe(LedgerOperationType.GroupCreated);
    });

    test('content is double encoded on disk, so it must be read through the entity', async () => {
        const sut = new EventRepository();
        await sut.appendEvent(new LedgerOperationQueuedEvent('e1', GROUP_ID, operation, true, new Date()));

        const [row] = await getDbContext().getRepository(OutboxEvent).query('SELECT content FROM outbox_event');

        // The column is json and we store a string in it, so raw SQL hands back a JSON encoded string.
        // Reading it straight from SQL yields a string instead of an event, and every field reads undefined.
        expect(typeof JSON.parse(row.content)).toBe('string');
    });

    test('drains in the order things were queued, not by type', async () => {
        const sut = new EventRepository();
        const at = new Date();

        // Queued in the same millisecond on purpose: a group create, its envelope, then the message.
        await sut.appendEvent(new LedgerOperationQueuedEvent('e1', GROUP_ID, operation, true, at));
        await sut.appendEvent(new EnvelopeQueuedEvent('e2', PayloadType.GroupCreated, { groupId: GROUP_ID }, ['bob'], at));
        await sut.appendEvent(new MessageSentEvent('e3', message(), ['bob'], ['alice', 'bob'], at));

        const drained: string[] = [];

        let next = await sut.getNext();
        while (next) {
            drained.push(next.id);
            await sut.markEventAsProcessed(next.id);
            next = await sut.getNext();
        }

        expect(drained).toEqual(['e1', 'e2', 'e3']);
    });

    test('skips an event whose kind no longer exists instead of blocking behind it', async () => {
        const sut = new EventRepository();
        const at = new Date();

        await getDbContext()
            .getRepository(OutboxEvent)
            .save(new OutboxEvent('old-1', 'ControlMessageQueuedEvent', '{"id":"old-1"}', at));
        await sut.appendEvent(new MessageSentEvent('e1', message(), ['bob'], ['alice'], at));

        const next = await sut.getNext();

        expect(next!.id).toBe('e1');
    });
});
