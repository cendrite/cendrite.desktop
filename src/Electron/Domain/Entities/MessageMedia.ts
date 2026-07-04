import { Message } from './Message.js';

export class MessageMedia {
    id!: string;
    type: string;
    messageId: string;
    message!: Message;

    constructor(type: string, messageId: string) {
        this.type = type;
        this.messageId = messageId;
    }
}
