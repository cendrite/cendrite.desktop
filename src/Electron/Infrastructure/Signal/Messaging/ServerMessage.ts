import { DeliveryStatus } from "../../../Domain/Enums/DeliveryStatus.js";

export type ServerMessageDto = {
    id: string;
    chatId: string | null;
    senderId: string;
    recipientId: string;
    payloadType: number;
    payload: string;
    timestamp: Date;
    messageToken: string | null;
};

export class ServerMessage {
    constructor(
        public readonly id: string,
        private readonly chatId: string | null = null,
        public readonly senderId: string,
        public readonly recipientId: string,
        public readonly payloadType: number,
        public readonly payload: string,
        public readonly timestamp: Date,
        public readonly messageToken: string | null = null,
    ) { }

    public get ChatId() {
        if (!this.chatId) {
            throw new Error(
                'ChatId is null, the message might not be associated with a chat, but a different operation.',
            );
        }
        return this.chatId;
    }

    public static fromDto(dto: ServerMessageDto): ServerMessage {
        return new ServerMessage(
            dto.id,
            dto.chatId,
            dto.senderId,
            dto.recipientId,
            dto.payloadType,
            dto.payload,
            dto.timestamp,
            dto.messageToken,
        );
    }
}

export enum PayloadType {
    ChatMessage = 0,
    DeliveryStatusUpdate = 1,
    SettingsUpdate = 2,
    DeleteMessage = 3,
    EditMessage = 4,
}

export abstract class Payload {
    constructor(public participants: string[]) { }
}

export class MessagePayload extends Payload {
    constructor(
        public text: string,
        public media: MediaPointer[], 
        public participants: string[],
        public deliveryStatus: DeliveryStatus,
    ) {
        super(participants);
    }
}

export class MediaPointer {
    constructor(
        public readonly id: string,
        public readonly type: string,
        public readonly iv: string,
        public readonly key: string,
    ) { }
}
