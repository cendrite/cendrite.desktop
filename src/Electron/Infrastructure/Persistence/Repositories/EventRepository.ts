import { IsNull } from 'typeorm';
import { IEventRepository } from '../../../Application/Contracts/Providers/IEventRepository.js';
import { DomainEvent, resolveDeserializer } from '../../../Domain/Events/IDomainEvent.js';
import { OutboxEvent } from '../../Models/OutboxEvent.js';
import { getDbContext } from '../Context/DatabaseContext.js';
import { IOutboxRepository } from '../../Interfaces/IOutboxRepository.js';

const UINT8_MARKER = '__uint8array_b64';

// JSON.stringify turns a Uint8Array into { "0": .., "1": .. }, which JSON.parse can't restore.
export function serializeEvent(event: DomainEvent): string {
    return JSON.stringify(event, function (key, value) {
        const raw = this[key];
        if (raw instanceof Uint8Array) {
            return { [UINT8_MARKER]: Buffer.from(raw).toString('base64') };
        }
        return value;
    });
}

export function parseEventContent(content: string): unknown {
    return JSON.parse(content, (_key, value) => {
        if (value && typeof value === 'object' && typeof value[UINT8_MARKER] === 'string') {
            return new Uint8Array(Buffer.from(value[UINT8_MARKER], 'base64'));
        }
        return value;
    });
}

export class EventRepository implements IEventRepository, IOutboxRepository {
    private readonly ctx = getDbContext().getRepository(OutboxEvent);

    public async appendEvent(event: DomainEvent): Promise<void> {
        const outboxEvent = new OutboxEvent(
            event.id,
            (event.constructor as typeof DomainEvent).type,
            serializeEvent(event),
            event.occurredOn,
        );

        await this.ctx.save(outboxEvent);
    }

    public async getEvents<T extends DomainEvent>(type: string, count: number): Promise<T[]> {
        const events = await this.ctx.find({
            order: {
                occurredOn: 'ASC',
            },
            take: count,
            where: {
                processedOn: IsNull(),
                type: type,
            },
        });

        return events.map((event) => {
            const deserializer = resolveDeserializer(event.type);
            if (!deserializer) {
                throw new Error(`No registered deserializer for type: ${event.type}`);
            }
            return deserializer(parseEventContent(event.content), event.occurredOn) as T;
        });
    }

    public async getEvent<T extends DomainEvent>(type: string): Promise<T | null> {
        const event = await this.ctx.findOne({
            order: {
                occurredOn: 'ASC',
            },
            where: {
                processedOn: IsNull(),
                type: type,
            },
        });

        if (!event) {
            return null;
        }

        const deserializer = resolveDeserializer(event.type);
        if (!deserializer) {
            throw new Error(`No registered deserializer for type: ${event.type}`);
        }
        return deserializer(parseEventContent(event.content), event.occurredOn) as T;
    }

    /**
     * The next event to send. Ordered by rowid as well as time, because events queued in the same
     * millisecond must still drain in the order they were written: a group's stream, its GroupCreated
     * envelopes and the first message depend on it.
     *
     * Only the ordering is done in SQL. The row itself is loaded through the entity so its content is
     * decoded the same way every other read decodes it.
     */
    public async getNext(): Promise<DomainEvent | null> {
        let event = await this.nextUnprocessed();

        while (event) {
            const deserializer = resolveDeserializer(event.type);
            if (deserializer) {
                return deserializer(parseEventContent(event.content), event.occurredOn);
            }

            // An event whose kind no longer exists would otherwise block everything behind it forever.
            await this.markAsFailed(event.id, `No registered deserializer for type: ${event.type}`);
            event = await this.nextUnprocessed();
        }

        return null;
    }

    private async nextUnprocessed(): Promise<OutboxEvent | null> {
        const rows: { id: string }[] = await this.ctx.query(
            'SELECT id FROM outbox_event WHERE processedOn IS NULL ORDER BY occurredOn ASC, rowid ASC LIMIT 1',
        );

        if (rows.length === 0) return null;

        return this.ctx.findOne({ where: { id: rows[0].id } });
    }

    public async markEventAsProcessed(id: string): Promise<void> {
        await this.ctx.update({ id }, { processedOn: new Date() });
    }

    public async markAsFailed(id: string, error: string): Promise<void> {
        await this.ctx.update({ id }, { error, processedOn: new Date() });
    }
}
