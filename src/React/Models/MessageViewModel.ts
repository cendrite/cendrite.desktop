import { DeliveryStatus } from '../../Shared/Enums/DeliveryStatus.ts';
import { v4 as uuid } from 'uuid';
import { Media } from './Media.ts';
import { MessageContract } from '../../Shared/Models/MessageContract.ts';

export class MessageViewModel {
    id: string;
    chatId: string;
    messageToken: string | null = null;
    senderId: string;
    text: string;
    media: Media[];
    date: Date;
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        message: string,
        date: Date,
        media: Media[],
        deliveryStatus: DeliveryStatus,
        messageToken: string | null = null,
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.text = message;
        this.date = date;
        this.media = media;
        this.deliveryStatus = deliveryStatus;
        this.messageToken = messageToken;
    }

    public static create(
        chatId: string,
        senderId: string,
        text: string | null,
        media: Media[] = [],
        deliveryStatus: DeliveryStatus,
    ): MessageViewModel {
        return new MessageViewModel(
            uuid().toString(),
            chatId,
            senderId,
            text || '',
            new Date(),
            media,
            deliveryStatus,
            uuid().toString(),
        );
    }

    public static mapFromContract(msg: MessageContract): MessageViewModel {
        return new MessageViewModel(
            msg.id,
            msg.chatId,
            msg.senderId,
            msg.text,
            msg.date,
            msg.media.map((m) => new Media(m.id, m.type, m.content)),
            msg.deliveryStatus,
            msg.messageToken,
        );
    }
}
