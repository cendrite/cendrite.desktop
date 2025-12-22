import { DeliveryStatus } from "../../../../Domain/Enums/DeliveryStatus.js";

export class MessageDto {
    id: string;
    messageToken: string | null;
    senderId: string
    content: string;
    contentUrl: string | null;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        messageToken: string | null,
        senderId: string,
        content: string,
        contentUrl: string | null,
        timestamp: Date,
        deliveryStatus: DeliveryStatus, 
    ) {
        this.id = id;
        this.messageToken = messageToken;
        this.senderId = senderId;
        this.content = content;
        this.contentUrl = contentUrl;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
    }
}
