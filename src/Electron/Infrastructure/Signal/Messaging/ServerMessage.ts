export type ServerMessageDto = {
    id: string;
    chatId: string | null;
    senderId: string;
    recipientId: string;
    payload: string;
    timestamp: Date;
    messageToken: string | null;
};

export class ServerMessage {
    constructor(
        public readonly id: string,
        public readonly chatId: string | null = null,
        public readonly senderId: string,
        public readonly recipientId: string,
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
            dto.payload,
            dto.timestamp,
            dto.messageToken,
        );
    }
}
