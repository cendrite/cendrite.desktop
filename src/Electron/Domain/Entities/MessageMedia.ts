import { Message } from './Message.js';

export class MessageMedia {
    id!: string;
    type: string;
    messageId: string;
    message!: Message;

    constructor(id: string, type: string) {
        this.type = type;
        this.messageId = id;
    }
}
