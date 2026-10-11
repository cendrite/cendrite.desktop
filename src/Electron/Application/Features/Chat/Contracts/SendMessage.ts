import { MediaContract } from "../../../Contracts/Models/MediaContract.js";
import { MessageContract } from "../../../Contracts/Models/MessageContract.js";

export class SendMessageCommand implements MediatorRequest {
    type = 'SendMessageCommand';
    public readonly messageId: string;
    public readonly userConnectionId: string;
    public readonly participants: string[];
    public readonly connectionIds: string[];
    public readonly chatId: string;
    public readonly message: string;
    public readonly media: MediaContract[];
    public readonly isGroup: boolean;

    constructor(
        chatId: string,
        messageId: string,
        userConnectionId: string,
        participants: string[],
        connectionIds: string[],
        message: string,
        media: MediaContract[] | null = null,
        isGroup: boolean = false,
    ) {
        this.messageId = messageId;
        this.userConnectionId = userConnectionId;
        this.participants = participants;
        this.connectionIds = connectionIds;
        this.chatId = chatId;
        this.message = message;
        this.media = media ?? [];
        this.isGroup = isGroup;
    }
}

export class MessageSentCommand implements MediatorRequest {
    type = MessageSentCommand.name;
    public readonly message: MessageContract;
    public readonly connectionIds: string[];
    public readonly participants: string[];

    public constructor(message: MessageContract, connectionIds: string[], participants: string[]) {
        this.message = message;
        this.connectionIds = connectionIds;
        this.participants = participants;
    }
}
