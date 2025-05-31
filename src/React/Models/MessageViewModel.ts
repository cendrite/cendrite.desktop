import {DeliveryStatus} from "../../Electron/Domain/Enums/DeliveryStatus.ts";

export class MessageViewModel {
    id!: string;
    chatId!: string;
    senderId: string;
    text: string;
    media: string | null;
    date: Date;
    deliveryStatus!: DeliveryStatus;

    constructor(id: string, chatId: string, senderId: string, message: string, date: Date, deliveryStatus: DeliveryStatus, mediaUrl: string | null = null) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.text = message;
        this.date = date;
        this.media = mediaUrl;
        this.deliveryStatus = deliveryStatus;
    }
}

