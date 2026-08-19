import { DomainEvent } from "../../../Domain/Events/IDomainEvent.js";

export interface IEventRepository {
    appendEvent(event: DomainEvent): Promise<void>;
}
