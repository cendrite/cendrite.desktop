import { DomainEvent } from "#electron/Domain/Events/IDomainEvent";

export interface IEventRepository {
    appendEvent(event: DomainEvent): Promise<void>;
}
