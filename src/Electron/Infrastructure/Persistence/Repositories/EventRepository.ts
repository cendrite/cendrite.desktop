import { IEventRepository } from "../../../Application/Contracts/Providers/IEventRepository.js";
import { DomainEvent, resolveDeserializer } from "../../../Domain/Events/IDomainEvent.js";
import { OutboxEvent } from "../../Models/OutboxEvent.js";
import { getDbContext } from "../Context/DatabaseContext.js";

export class EventRepository implements IEventRepository {
    private readonly ctx = getDbContext().getRepository(OutboxEvent);

    public async appendEvent(event: DomainEvent): Promise<void> {
        const outboxEvent = new OutboxEvent(
            (event.constructor as typeof DomainEvent).type,
            JSON.stringify(event),
            event.occurredOn,
        );

        await this.ctx.save(outboxEvent);
    }

    public async getEvents(type: string, count: number): Promise<DomainEvent[]> {
        const events = await this.ctx.find({
            order: {
                occurredOn: 'ASC',
            },
            take: count,
            where: {
                processedOn: undefined,
                type: type,
            },
        });

        return events.map((event) => {
            const deserializer = resolveDeserializer(event.type);
            if (!deserializer) {
                throw new Error(`No registered deserializer for type: ${event.type}`);
            }
            return deserializer(JSON.parse(event.content), event.occurredOn);
        });
    }
}
