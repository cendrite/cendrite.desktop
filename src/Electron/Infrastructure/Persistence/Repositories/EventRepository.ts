import { IsNull } from "typeorm";
import { IEventRepository } from "../../../Application/Contracts/Providers/IEventRepository.js";
import { DomainEvent, resolveDeserializer } from "../../../Domain/Events/IDomainEvent.js";
import { OutboxEvent } from "../../Models/OutboxEvent.js";
import { getDbContext } from "../Context/DatabaseContext.js";
import { IOutboxRepository } from "../../Interfaces/IOutboxRepository.js";

export class EventRepository implements IEventRepository, IOutboxRepository {


    private readonly ctx = getDbContext().getRepository(OutboxEvent);

    public async appendEvent(event: DomainEvent): Promise<void> {
        const outboxEvent = new OutboxEvent(
            event.id,
            (event.constructor as typeof DomainEvent).type,
            JSON.stringify(event),
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
            return deserializer(JSON.parse(event.content), event.occurredOn) as T;
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
        return deserializer(JSON.parse(event.content), event.occurredOn) as T;
    }

    public async markEventAsProcessed(id: string): Promise<void> {
        await this.ctx.update({ id }, { processedOn: new Date() });
    }

    public async markAsFailed(id: string, error: string): Promise<void> {
        await this.ctx.update({ id }, { error });
    }
}
