import { DomainEvent } from "#electron/Domain/Events/IDomainEvent";

export interface IOutboxRepository {
    getEvents<T extends DomainEvent>(type: string, count: number): Promise<T[]>;
    getEvent<T extends DomainEvent>(type: string): Promise<T | null>;
    markEventAsProcessed(id: string): Promise<void>;
    markAsFailed(id: string, error: string): Promise<void>;
}
