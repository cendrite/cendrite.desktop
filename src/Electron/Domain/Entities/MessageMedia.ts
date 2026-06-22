import { Chat } from '../Aggregates/Chat.js';
import { Message } from './Message.js';

export class MessageMedia {
    id!: string;
    chatId: string;
    media: string;
    messageId: string;
    message!: Message;
    chat!: Chat;

    constructor(chatId: string, media: string, messageId: string) {
        this.chatId = chatId;
        this.media = media;
        this.messageId = messageId;
    }
}
