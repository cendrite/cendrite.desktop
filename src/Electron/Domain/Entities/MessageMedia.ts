import { Message } from './Message.js';

export class MessageMedia {
    id!: string;
    type: string;
    messageId: string;
    message!: Message;

    constructor(id: string, type: string, messageId: string) {
        this.id = id;
        this.type = type;
        this.messageId = messageId;
    }
}
