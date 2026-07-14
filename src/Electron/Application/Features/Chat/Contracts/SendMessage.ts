export class SendMessageCommand implements MediatorRequest {
    type = 'SendMessageCommand';
    public readonly userConnectionId: string;
    public readonly connectionIds: string[];
    public readonly chatId: string;
    public readonly message: string;
    public readonly media: { id: string; type: string; content: Uint8Array } | null;

    constructor(
        userConnectionId: string,
        connectionIds: string[],
        chatId: string,
        message: string,
        media: { id: string; type: string; content: Uint8Array } | null,
    ) {
        this.userConnectionId = userConnectionId;
        this.connectionIds = connectionIds;
        this.chatId = chatId;
        this.message = message;
        this.media = media;
    }
}
