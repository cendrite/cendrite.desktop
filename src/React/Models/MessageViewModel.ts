import { DeliveryStatus } from '../../Electron/Domain/Enums/DeliveryStatus.ts';
import { v4 as uuid } from 'uuid';
import { MessagePayload, ServerMessage } from '../SignalR/Messaging/ServerMessage.ts';

export class MessageViewModel {
    id: string;
    chatId: string;
    messageToken: string | null = null;
    senderId: string;
    text: string;
    media: string | null;
    date: Date;
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        message: string,
        date: Date,
        deliveryStatus: DeliveryStatus,
        mediaUrl: string | null = null,
        messageToken: string | null = null,
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.text = message;
        this.date = date;
        this.media = mediaUrl;
        this.deliveryStatus = deliveryStatus;
        this.messageToken = messageToken;
    }

    public static create(
        chatId: string,
        senderId: string,
        text: string | null,
        media: string | null,
        deliveryStatus: DeliveryStatus,
    ): MessageViewModel {
        return new MessageViewModel(
            uuid().toString(),
            chatId,
            senderId,
            text || '',
            new Date(),
            deliveryStatus,
            media || null,
            uuid().toString(),
        );
    }

    public static mapFromDecrypted(msg: ServerMessage, decryptedContent: MessagePayload): MessageViewModel {
        return new MessageViewModel(
            msg.id,
            msg.ChatId,
            msg.senderId,
            decryptedContent.text,
            msg.timestamp,
            decryptedContent.deliveryStatus,
            decryptedContent.media || null,
        );
    }
}
