import { DomainEvent } from "#electron/Domain/Events/IDomainEvent";

export interface IEventRepository {
    appendEvent(event: DomainEvent): Promise<void>;
    getEventById<T extends DomainEvent>(id: string): Promise<T | null>;
}
