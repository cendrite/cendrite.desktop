import { PayloadType } from '../../Application/Contracts/Messaging/Envelope.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

/**
 * An envelope waiting to be sent. It goes through the outbox like a message does, so the order it was
 * queued in is the order it leaves in, and nothing is lost while the hub is down.
 */
export class EnvelopeQueuedEvent extends DomainEvent {
    static readonly type = EnvelopeQueuedEvent.name;

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
    EnvelopeQueuedEvent.type,
    EnvelopeQueuedEvent,
    (raw: any, occurredOn: Date) =>
        new EnvelopeQueuedEvent(raw.id, raw.payloadType, raw.payload, raw.connectionIds, occurredOn),
);
