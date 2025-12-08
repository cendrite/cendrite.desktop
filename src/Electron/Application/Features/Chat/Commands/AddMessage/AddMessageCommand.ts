export class AddMessageCommand implements MediatorRequest {
    type: string = AddMessageCommand.name;
    chatId: string;
    messageId: string;
    senderId: string;
    messageToken: string | null;
    content: string;
    contentUrl: string | null;
    timestamp: Date;
    deliveryStatus: number;

    constructor(
        chatId: string,
        messageId: string,
        senderId: string,
        content: string,
        timestamp: Date,
        deliveryStatus: number,
        contentUrl: string | null = null,
        messageToken: string | null = null,
    ) {
        this.chatId = chatId;
        this.messageId = messageId;
        this.senderId = senderId;
        this.content = content;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
        this.contentUrl = contentUrl;
        this.messageToken = messageToken;
    }
}
