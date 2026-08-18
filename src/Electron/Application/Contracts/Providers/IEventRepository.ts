import { DomainEvent } from "../../../Domain/Events/IDomainEvent.js";

export interface IEventRepository {
    appendEvent(event: DomainEvent): Promise<void>;
    getEvents(type: string, count: number): Promise<DomainEvent[]>;
}
