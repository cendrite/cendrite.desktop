import {DeliveryStatus} from "../../Electron/Domain/Enums/DeliveryStatus.ts";

export class MessageViewModel {
    id!: string;
    chatId!: string;
    senderId: string;
    message: string;
    contentUrl: string | null;
    date: Date;
    deliveryStatus!: DeliveryStatus;

    constructor(id: string, chatId: string, senderId: string, message: string, date: Date, deliveryStatus: DeliveryStatus, contentUrl: string | null = null) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.message = message;
        this.date = date;
        this.contentUrl = contentUrl;
        this.deliveryStatus = deliveryStatus;
    }
}

