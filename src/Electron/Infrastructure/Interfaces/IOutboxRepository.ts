import { DomainEvent } from "#electron/Domain/Events/IDomainEvent";

export interface IOutboxRepository {
    getEvents<T extends DomainEvent>(type: string, count: number): Promise<T[]>;
    getEvent<T extends DomainEvent>(type: string): Promise<T | null>;
    deleteEvent(id: string): Promise<void>;
    deleteAll(): Promise<void>;
}
