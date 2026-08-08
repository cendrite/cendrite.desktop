import { DeliveryStatus } from "../../../Domain/Enums/DeliveryStatus.js";
import { MediaContract } from "./MediaContract.js";

export class MessageContract {
    id: string;
    chatId: string;
    messageToken: string | null = null;
    senderId: string;
    text: string;
    media: MediaContract[];
    date: Date;
    deliveryStatus: DeliveryStatus;

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        text: string,
        date: Date,
        media: MediaContract[],
        deliveryStatus: DeliveryStatus,
        messageToken: string | null = null,
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.text = text;
        this.date = date;
        this.media = media;
        this.deliveryStatus = deliveryStatus;
        this.messageToken = messageToken;
    }
}
