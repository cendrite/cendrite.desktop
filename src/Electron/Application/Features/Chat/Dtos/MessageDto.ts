import { Message } from '../../../../Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { Media } from '../../Files/Dto/Media.js';

export class MessageDto {
    id: string;
    messageToken: string | null;
    senderId: string;
    timestamp: Date;
    content: string;
    media: Media[];
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        messageToken: string | null,
        senderId: string,
        content: string,
        timestamp: Date,
        media: Media[],
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

    public static fromMessage(message: Message): MessageDto {
        console.log("mapping message to MessageDto:", message);
        return new MessageDto(
            message.id,
            message.messageToken,
            message.senderId,
            message.content,
            message.timestamp,
            message.messageMedia?.map((media) => ({
                url: media.getUrl(),
                content: media.media,
                type: media.type,
            })) ?? [],
            message.deliveryStatus,
        );
    }
}
