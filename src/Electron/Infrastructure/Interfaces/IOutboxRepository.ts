import { DomainEvent } from "../../Domain/Events/IDomainEvent.js";

export interface IOutboxRepository {
    getEvents<T extends DomainEvent>(type: string, count: number): Promise<T[]>;
    getEvent<T extends DomainEvent>(type: string): Promise<T | null>;

    /** The oldest unprocessed event of any kind: the outbox is drained in the order things were queued. */
    getNext(): Promise<DomainEvent | null>;

    markEventAsProcessed(id: string): Promise<void>;
    markAsFailed(id: string, error: string): Promise<void>;
}
