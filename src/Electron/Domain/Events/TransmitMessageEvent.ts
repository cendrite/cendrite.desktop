import { MessageContract } from "../../Application/Contracts/Models/MessageContract.js";
import { DomainEvent, registerDomainEvent } from "./IDomainEvent.js";

export class TransmitMessageEvent extends DomainEvent {
    static readonly type = 'TransmitMessageEvent';
    public readonly message: MessageContract;
    public readonly connectionIds: string[];

    constructor(id: string, message: MessageContract, connectionIds: string[], occurredOn: Date) {
        super(id, occurredOn);
        this.message = message;
        this.connectionIds = connectionIds;
    }
}

registerDomainEvent(TransmitMessageEvent.type, TransmitMessageEvent, (raw: any, occurredOn: Date) => {
    return new TransmitMessageEvent(raw.id, raw.message, raw.connectionIds, occurredOn);
});
