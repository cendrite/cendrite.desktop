import { Message } from '../../../../Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { MediaDto } from './MediaDto.js';

export class MessageDto {
    id: string;
    messageToken: string | null;
    senderId: string;
    timestamp: Date;
    content: string;
    media: MediaDto[];
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        messageToken: string | null,
        senderId: string,
        content: string,
        timestamp: Date,
        media: MediaDto[],
        deliveryStatus: DeliveryStatus,
    ) {
        this.id = id;
        this.messageToken = messageToken;
        this.senderId = senderId;
        this.content = content;
        this.timestamp = timestamp;
        this.media = media;
        this.deliveryStatus = deliveryStatus;
    }

    public static fromMessage(message: Message, media: MediaDto[]): MessageDto {
        return new MessageDto(
            message.id,
            message.messageToken,
            message.senderId,
            message.content,
            message.timestamp,
            media,
            message.deliveryStatus,
        );
    }
}
