import { Chat } from '../Aggregates/Chat.js';
import { Message } from './Message.js';

export class MessageMedia {
    id: string;
    chatId: string;
    media: string;
    messageId: string;
    message!: Message;
    chat!: Chat;

    constructor(id: string, chatIdL: string, media: string, messageId: string) {
        this.id = id;
        this.chatId = chatIdL;
        this.media = media;
        this.messageId = messageId;
    }
}
