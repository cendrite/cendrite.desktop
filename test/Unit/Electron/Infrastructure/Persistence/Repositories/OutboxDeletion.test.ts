import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { getDbContext, initializeDatabase } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { EventRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/EventRepository.js';
import { OutboxEvent } from '../../../../../../src/Electron/Infrastructure/Models/OutboxEvent.js';

let sut: EventRepository;

beforeAll(async () => {
    await initializeDatabase(':memory:');
    sut = new EventRepository();
});

beforeEach(async () => {
    await sut.deleteAll();
});

const outbox = () => getDbContext().getRepository(OutboxEvent);

describe('outbox deletion', () => {
    test('deleteEvent removes only that event', async () => {
        await outbox().save([
            new OutboxEvent('evt-1', 'MessageSentEvent', '{"strap":"secret"}', new Date()),
            new OutboxEvent('evt-2', 'MessageSentEvent', '{}', new Date()),
        ]);

        await sut.deleteEvent('evt-1');

        expect((await outbox().find()).map((e) => e.id)).toEqual(['evt-2']);
    });

    test('deleteAll empties the outbox', async () => {
        await outbox().save([
            new OutboxEvent('evt-1', 'MessageSentEvent', '{}', new Date()),
            new OutboxEvent('evt-2', 'DeliveryStatusUpdateEvent', '{}', new Date(), new Date()),
        ]);

        await sut.deleteAll();

        expect(await outbox().count()).toBe(0);
    });
});
