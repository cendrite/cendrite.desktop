import { Message } from '../../../../Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { MediaContract } from '../../../Contracts/Models/MediaContract.js';

export class MessageDto {
    id: string;
    messageToken: string | null;
    senderId: string;
    timestamp: Date;
    content: string;
    media: MediaContract[];
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        messageToken: string | null,
        senderId: string,
        content: string,
        timestamp: Date,
        media: MediaContract[],
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

    public static fromMessage(message: Message, media: MediaContract[]): MessageDto {
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
