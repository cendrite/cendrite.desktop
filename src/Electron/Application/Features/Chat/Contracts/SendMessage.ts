import { MediaContract } from "../../../Contracts/Models/MediaContract.js";

export class SendMessageCommand implements MediatorRequest {
    type = 'SendMessageCommand';
    public readonly messageId: string;
    public readonly userConnectionId: string;
    public readonly participants: string[];
    public readonly connectionIds: string[];
    public readonly chatId: string;
    public readonly message: string;
    public readonly media: MediaContract[];

    constructor(
        chatId: string,
        messageId: string,
        userConnectionId: string,
        participants: string[],
        connectionIds: string[],
        message: string,
        media: MediaContract[] | null = null,
    ) {
        this.messageId = messageId;
        this.userConnectionId = userConnectionId;
        this.participants = participants;
        this.connectionIds = connectionIds;
        this.chatId = chatId;
        this.message = message;
        this.media = media ?? [];
    }
}

export class SendMessageV2Command implements MediatorRequest {
    type = 'SendMessageV2Command';
    public readonly messageId: string;
    public readonly userConnectionId: string;
    public readonly participants: string[];
    public readonly connectionIds: string[];
    public readonly chatId: string;
    public readonly message: string;
    public readonly media: MediaContract[];

    constructor(
        chatId: string,
        messageId: string,
        userConnectionId: string,
        participants: string[],
        connectionIds: string[],
        message: string,
        media: MediaContract[] | null = null,
    ) {
        this.messageId = messageId;
        this.userConnectionId = userConnectionId;
        this.participants = participants;
        this.connectionIds = connectionIds;
        this.chatId = chatId;
        this.message = message;
        this.media = media ?? [];
    }
}
