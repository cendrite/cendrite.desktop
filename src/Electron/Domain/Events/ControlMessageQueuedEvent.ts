import { PayloadType } from '../../Application/Contracts/Messaging/Envelope.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

/**
 * Control traffic goes through the outbox like messages do, so an invite is not lost when the hub
 * happens to be down, and so the receiver never depends on the sender.
 */
export class ControlMessageQueuedEvent extends DomainEvent {
    static readonly type = ControlMessageQueuedEvent.name;

    constructor(
        id: string,
        public readonly payloadType: PayloadType,
        public readonly payload: unknown,
        public readonly connectionIds: string[],
        occurredOn: Date,
    ) {
        super(id, occurredOn);
    }
}

registerDomainEvent(
    ControlMessageQueuedEvent.type,
    ControlMessageQueuedEvent,
    (raw: any, occurredOn: Date) =>
        new ControlMessageQueuedEvent(raw.id, raw.payloadType, raw.payload, raw.connectionIds, occurredOn),
);
