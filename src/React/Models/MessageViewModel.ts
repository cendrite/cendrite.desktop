import { DeliveryStatus } from '@/Shared/Enums/DeliveryStatus.ts';
import { v4 as uuid } from 'uuid';
import { Media } from './Media.ts';
import { MessageContract } from '@/Shared/Models/MessageContract.ts';

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

    get hasText(): boolean {
        return this.text.trim().length > 0;
    }

    get previewText(): string {
        if (this.hasText) return this.text;

        const count = this.media.length;
        if (count === 0) return '';

        const label = MessageViewModel.mediaLabel(this.media);
        if (count === 1) return label.singular;
        return `${count} ${label.plural}`;
    }

    private static mediaLabel(media: Media[]): { singular: string; plural: string } {
        const types = media.map((m) => m.type);
        const all = (predicate: (type: string) => boolean) => types.every(predicate);

        if (all((t) => t === 'image/gif')) return { singular: 'GIF', plural: 'GIFs' };
        if (all((t) => t.startsWith('image/'))) return { singular: 'Photo', plural: 'photos' };
        if (all((t) => t.startsWith('video/'))) return { singular: 'Video', plural: 'videos' };
        if (all((t) => t.startsWith('audio/'))) return { singular: 'Audio', plural: 'audio files' };
        if (all((t) => t.startsWith('image/') || t.startsWith('video/')))
            return { singular: 'Media', plural: 'photos and videos' };
        return { singular: 'Attachment', plural: 'attachments' };
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
