import { Message } from '../../../../Domain/Entities/Message.js';

export class TransmitMessageCommand implements MediatorRequest {
    type = 'TransmitMessageCommand';
    public readonly message: Message;

    public constructor(message: Message) {
        this.message = message;
    }
}
