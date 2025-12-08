export class MessageDto {
    id: string;
    messageToken: string | null;
    senderId: string
    content: string;
    contentUrl: string | null;
    timestamp: Date;
    deliveryStatus: number;

    constructor(
        id: string,
        messageToken: string | null,
        senderId: string,
        content: string,
        contentUrl: string | null,
        timestamp: Date,
        deliveryStatus: number
    ) {
        this.id = id;
        this.messageToken = messageToken;
        this.senderId = senderId;
        this.content = content;
        this.contentUrl = contentUrl;
        this.timestamp = timestamp;
        this.deliveryStatus = deliveryStatus;
    }
}
