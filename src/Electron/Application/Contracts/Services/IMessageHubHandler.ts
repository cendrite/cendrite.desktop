import { DeliveryStatus } from '../../../../Shared/Contracts/Enums/DeliveryStatus.js';

export interface IMessageHubHandler {
    sendMessage(messages: ServerMessage[]): Promise<DeliveryStatus>;
}

export type ServerMessageDto = {
    id: string;
    senderId: string;
    recipientId: string;
    payload: string;
    timestamp: Date;
    messageToken: string | null;
};

export class ServerMessage {
    constructor(
        public readonly id: string,
        public readonly senderId: string,
        public readonly recipientId: string,
        public readonly payload: string,
        public readonly timestamp: Date,
        public readonly messageToken: string | null = null,
    ) { }

    public static fromDto(dto: ServerMessageDto): ServerMessage {
        return new ServerMessage(
            dto.id,
            dto.senderId,
            dto.recipientId,
            dto.payload,
            dto.timestamp,
            dto.messageToken,
        );
    }
}
