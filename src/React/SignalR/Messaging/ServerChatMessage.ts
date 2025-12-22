import { DeliveryStatus } from "../../../Electron/Domain/Enums/DeliveryStatus";
import { MessageViewModel } from "../../Models/MessageViewModel";

export class ServerChatMessage {
    public id: string;
    public chatId: string;
    public senderId: string;
    public recipientId: string;
    public messageToken: string | null;
    public content: string;
    public timestamp: Date;

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        recipientId: string,
        content: string,
        timestamp: Date,
        messageToken: string | null = null,
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.messageToken = messageToken;
        this.timestamp = timestamp;
        this.content = content;
    }

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
    public text: string;
    public media: string | null;
    public participants: string[];
    public deliveryStatus: DeliveryStatus;

    constructor(
        text: string,
        media: string | null,
        participants: string[],
        deliveryStatus: DeliveryStatus,
    ) {
        this.text = text;
        this.media = media;
        this.participants = participants;
        this.deliveryStatus = deliveryStatus;
    }
}
