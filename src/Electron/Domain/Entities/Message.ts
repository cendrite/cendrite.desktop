import { DeliveryStatus } from '../Enums/DeliveryStatus.js';
import { Chat } from '../Aggregates/Chat.js';
import { MessageMedia } from './MessageMedia.js';

export class Message {
    id: string;
    messageToken: string | null;
    senderId: string;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;
    chatId: string;
    chat!: Chat;
    content: string;
    MessageMedia: MessageMedia[];

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        timestamp: Date,
        content: string | null,
        messageMedia: MessageMedia[] = [],
        deliveryStatus: DeliveryStatus,
        messageToken: string | null = null,
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
        this.MessageMedia = messageMedia;
        this.content = content || '';
        this.messageToken = messageToken;
    }
}
