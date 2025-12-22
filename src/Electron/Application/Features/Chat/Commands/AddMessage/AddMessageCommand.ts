import { DeliveryStatus } from "../../../../../Domain/Enums/DeliveryStatus.js";

export class AddMessageCommand implements MediatorRequest {
    type: string = AddMessageCommand.name;
    chatId: string;
    messageId: string;
    senderId: string;
    messageToken: string | null;
    content: string;
    contentUrl: string | null;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;

    constructor(
        chatId: string,
        messageId: string,
        senderId: string,
        content: string,
        timestamp: Date,
        deliveryStatus: DeliveryStatus,
        contentUrl: string | null = null,
        messageToken: string | null = null,
    ) {
        this.chatId = chatId;
        this.messageId = messageId;
        this.senderId = senderId;
        this.content = content;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
        this.contentUrl = contentUrl;
        this.messageToken = messageToken;
    }
}
