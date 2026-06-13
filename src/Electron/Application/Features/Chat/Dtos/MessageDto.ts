import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';

export class MessageDto {
    id: string;
    messageToken: string | null;
    senderId: string;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        messageToken: string | null,
        senderId: string,
        timestamp: Date,
        deliveryStatus: DeliveryStatus,
    ) {
        this.id = id;
        this.messageToken = messageToken;
        this.senderId = senderId;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
    }
}
