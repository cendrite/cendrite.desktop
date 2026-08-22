import { DeliveryStatus } from '../Enums/DeliveryStatus.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

export class DeliveryStatusUpdatedEvent extends DomainEvent {
    static readonly type = 'DeliveryStatusUpdateEvent';

    constructor(
        public readonly id: string,
        public readonly senderId: string,
        public readonly occurredOn: Date,
        public readonly chatId: string,
        public readonly messageIds: string[],
        public readonly deliveryStatus: DeliveryStatus,
        public readonly participants: string[],
        public readonly connectionIds: string[],
    ) {
        super(id, occurredOn);
    }
}

registerDomainEvent(DeliveryStatusUpdatedEvent.type, DeliveryStatusUpdatedEvent, (raw: any, occurredOn: Date) => {
    return new DeliveryStatusUpdatedEvent(
        raw.id,
        raw.senderId,
        occurredOn,
        raw.chatId,
        raw.messageIds,
        raw.deliveryStatus,
        raw.participants,
        raw.connectionIds,
    );
});
