import { DomainEvent } from "#electron/Domain/Events/IDomainEvent";
import { IEventRepository } from "#electron/Application/Contracts/Providers/IEventRepository";

export interface IOutboxRepository extends IEventRepository {
    getEvents<T extends DomainEvent>(type: string, count: number): Promise<T[]>;
    getEvent<T extends DomainEvent>(type: string): Promise<T | null>;
    markAsFailed(id: string, error: string): Promise<void>;
    deleteEvent(id: string): Promise<void>;
    deleteForGroup(groupId: string): Promise<void>;
    deleteAll(): Promise<void>;
}
