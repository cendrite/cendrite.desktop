import { DeliveryStatus } from '../../../../../Domain/Enums/DeliveryStatus.js';
import { MediaDto } from '../../Dtos/MediaDto.js';

export class AddMessageCommand implements MediatorRequest {
    type: string = AddMessageCommand.name;
    chatId: string;
    messageId: string;
    senderId: string;
    messageToken: string | null;
    timestamp: Date;
    deliveryStatus: DeliveryStatus;
    content: string | null = null;
    media: MediaDto[] | null = null; 

    constructor(
        chatId: string,
        messageId: string,
        senderId: string,
        timestamp: Date,
        deliveryStatus: DeliveryStatus,
        messageToken: string | null = null,
        content: string | null = null,
        media: MediaDto[] | null = null,
    ) {
        this.chatId = chatId;
        this.messageId = messageId;
        this.senderId = senderId;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
        this.messageToken = messageToken;
        this.media = media;
        this.content = content;
    }
}
