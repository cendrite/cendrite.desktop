import { DeliveryStatus } from '../Enums/DeliveryStatus.js';
import { Chat } from '../Aggregates/Chat.js';

export class Message {
    id: string;
    messageToken: string | null;
    senderId: string;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;
    chatId: string;
    chat!: Chat;
    content: string;
    mediaIds: string[] | null;

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        timestamp: Date,
        content: string | null,
        messageMedia: string[] | null = null,
        deliveryStatus: DeliveryStatus,
        messageToken: string | null = null,
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
        this.mediaIds = messageMedia ?? null;
        this.content = content || '';
        this.messageToken = messageToken;
    }
}
