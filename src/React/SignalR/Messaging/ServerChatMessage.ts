import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus';
import { MessageViewModel } from '../../Models/MessageViewModel';

export class ServerChatMessage {
    constructor(
        public id: string,
        public chatId: string,
        public senderId: string,
        public recipientId: string,
        public content: string,
        public timestamp: Date,
        public messageToken: string | null = null,
    ) { }

    public static create(message: MessageViewModel, recipientId: string, content: string): ServerChatMessage {
        return new ServerChatMessage(
            message.id,
            message.chatId,
            message.senderId,
            recipientId,
            content,
            message.date,
            message.messageToken,
        );
    }
}

export class MessagePayload {
    constructor(
        public text: string,
        public media: string | null,
        public participants: string[],
        public deliveryStatus: DeliveryStatus,
    ) { }
}
