import { Message } from './Message.js';

export class MessageMedia {
    id!: string;
    media: string;
    type: string;
    messageId: string;
    message!: Message;

    constructor(media: string, type: string, messageId: string) {
        this.media = media;
        this.type = type;
        this.messageId = messageId;
    }

    public getUrl(): string {
        return `data:${this.type};base64,${this.media}`;
    }
}
