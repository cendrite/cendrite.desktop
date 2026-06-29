import { DeliveryStatus } from '../../Electron/Domain/Enums/DeliveryStatus.ts';
import { v4 as uuid } from 'uuid';
import { MessagePayload, ServerMessage } from '../SignalR/Messaging/ServerMessage.ts';
import { MessageDto } from '../../Electron/Application/Features/Chat/Dtos/MessageDto.ts';
import { Media } from './Media.ts';

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

    public static mapFromDecrypted(
        msg: ServerMessage,
        decryptedContent: MessagePayload,
        initialDeliveryStatus: DeliveryStatus,
    ): MessageViewModel {
        return new MessageViewModel(
            msg.id,
            msg.ChatId,
            msg.senderId,
            decryptedContent.text,
            new Date(msg.timestamp),
            decryptedContent.media || [],
            initialDeliveryStatus,
        );
    }

    public static mapFromDto(chatId: string, dto: MessageDto): MessageViewModel {
        return new MessageViewModel(
            dto.id,
            chatId,
            dto.senderId,
            dto.content,
            new Date(dto.timestamp),
            dto.media,
            dto.deliveryStatus,
            dto.messageToken,
        );
    }
}
