import { IDomainEvent } from "../../../Domain/Events/IEvent.js";

export interface IEventRepository {
    appendEvent(event: IDomainEvent): Promise<void>;
    getEvents(eventType: string, count: number): Promise<IDomainEvent[]>;
}
