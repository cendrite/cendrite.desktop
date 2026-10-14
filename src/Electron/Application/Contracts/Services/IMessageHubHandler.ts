import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';

export interface IMessageHubHandler {
    sendMessage(messages: ServerMessage[]): Promise<DeliveryStatus>;
}

export class ServerMessage {
    constructor(
        public readonly id: string,
        public readonly senderId: string,
        public readonly recipientId: string,
        public readonly payload: string,
        public readonly timestamp: Date,
        public readonly messageToken: string | null = null,
    ) { }
}
