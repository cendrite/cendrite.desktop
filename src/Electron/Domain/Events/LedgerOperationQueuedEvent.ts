import { LedgerOperation } from '../Operations/LedgerOperation.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

/**
 * The intent to write, not the written event. Version, previous hash and the signature over them all
 * change whenever another member writes first, so they are built by the pump against the current head.
 */
export class LedgerOperationQueuedEvent extends DomainEvent {
    static readonly type = LedgerOperationQueuedEvent.name;

    constructor(
        id: string,
        public readonly groupId: string,
        public readonly operation: LedgerOperation,
        public readonly createsStream: boolean,
        occurredOn: Date,
    ) {
        super(id, occurredOn);
    }
}

registerDomainEvent(
    LedgerOperationQueuedEvent.type,
    LedgerOperationQueuedEvent,
    (raw: any, occurredOn: Date) =>
        new LedgerOperationQueuedEvent(raw.id, raw.groupId, raw.operation, raw.createsStream, occurredOn),
);
