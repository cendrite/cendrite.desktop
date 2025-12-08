import { DeliveryStatus } from '../Enums/DeliveryStatus.js';
import { Chat } from '../Aggregates/Chat.js';

export class Message {
    id: string;
    messageToken: string | null;
    senderId: string;
    content: string;
    contentUrl: string | null;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;
    chatId: string;
    chat!: Chat;

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        content: string,
        timestamp: Date,
        deliveryStatus: DeliveryStatus,
        contentUrl: string | null = null,
        messageToken: string | null = null,
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.content = content;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
        this.messageToken = messageToken;
        this.contentUrl = contentUrl;
    }
}
