import { DeliveryStatus } from '../Enums/DeliveryStatus.js';
import { DomainEvent } from './IDomainEvent.js';

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
