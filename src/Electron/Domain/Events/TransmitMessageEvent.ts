import { MessageContract } from "../../Application/Contracts/Models/MessageContract.js";
import { DomainEvent } from "./IDomainEvent.js";

export class TransmitMessageEvent extends DomainEvent {
    static readonly type = 'TransmitMessageEvent';
    public readonly message: MessageContract;
    public readonly connectionIds: string[];

    constructor(message: MessageContract, connectionIds: string[], occurredOn: Date) {
        super(occurredOn);
        this.message = message;
        this.connectionIds = connectionIds;
    }
}
