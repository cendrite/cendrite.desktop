import { IEventRepository } from "../../../Application/Contracts/Providers/IEventRepository.js";
import { IDomainEvent } from "../../../Domain/Events/IDomainEvent.js";
import { PumpEvent} from "../../Models/PumpEvent.js";
import { getDbContext } from "../Context/DatabaseContext.js";

export class EventRepository implements IEventRepository {
    private readonly ctx = getDbContext().getRepository(PumpEvent);

    public async appendEvent(event: IDomainEvent): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async getEvents(eventType: string, count: number): Promise<IDomainEvent[]> {
        throw new Error("Method not implemented.");
    }
}
