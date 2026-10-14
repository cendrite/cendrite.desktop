import { MessageContract } from '../../../Shared/Contracts/Models/MessageContract.js';
import { Payload } from '../Protocol/Payload.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

export class MessageSentEvent extends DomainEvent {
    static readonly type = MessageSentEvent.name;
    public readonly message: MessageContract;
    public readonly connectionIds: string[];
    public readonly participants: string[];
    public readonly payloads: Record<string, Payload[]>;

    constructor(
        id: string,
        message: MessageContract,
        connectionIds: string[],
        participants: string[],
        occurredOn: Date,
        payloads: Record<string, Payload[]> = {},
    ) {
        super(id, occurredOn);
        this.message = message;
        this.connectionIds = connectionIds;
        this.participants = participants;
        this.payloads = payloads;
    }
}

registerDomainEvent(MessageSentEvent.type, MessageSentEvent, (raw: any, occurredOn: Date) => {
    return new MessageSentEvent(
        raw.id,
        raw.message,
        raw.connectionIds,
        raw.participants,
        occurredOn,
        raw.payloads ?? {},
    );
});
