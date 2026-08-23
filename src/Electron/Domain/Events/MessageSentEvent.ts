import { MessageContract } from '../../Application/Contracts/Models/MessageContract.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

export class MessageSentEvent extends DomainEvent {
    static readonly type = MessageSentEvent.name;
    public readonly message: MessageContract;
    public readonly connectionIds: string[];
    public readonly participants: string[];

    constructor(
        id: string,
        message: MessageContract,
        connectionIds: string[],
        participants: string[],
        occurredOn: Date,
    ) {
        super(id, occurredOn);
        this.message = message;
        this.connectionIds = connectionIds;
        this.participants = participants;
    }
}

registerDomainEvent(MessageSentEvent.type, MessageSentEvent, (raw: any, occurredOn: Date) => {
    return new MessageSentEvent(raw.id, raw.message, raw.connectionIds, raw.participants, occurredOn);
});
