import { DeliveryStatus } from '../../../../../Domain/Enums/DeliveryStatus.js';

export class AddMessageCommand implements MediatorRequest {
    type: string = AddMessageCommand.name;
    chatId: string;
    messageId: string;
    senderId: string;
    messageToken: string | null;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;
    content: string | null = null;
    mediaIds: string[] | null;

    constructor(
        chatId: string,
        messageId: string,
        senderId: string,
        timestamp: Date,
        deliveryStatus: DeliveryStatus,
        messageToken: string | null = null,
        content: string | null = null,
        messageMedia: string[] | null = null,
    ) {
        this.chatId = chatId;
        this.messageId = messageId;
        this.senderId = senderId;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
        this.messageToken = messageToken;
        this.mediaIds = messageMedia;
        this.content = content;
    }
}
