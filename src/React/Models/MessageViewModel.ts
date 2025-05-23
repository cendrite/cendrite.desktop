export class MessageViewModel {
    id!: string;
    chatId!: string;
    senderId: string;
    message: string;
    contentUrl: string | null;
    date: Date;
    isRead: boolean;

    constructor(id: string, chatId: string, senderId: string, message: string, date: Date, isRead: boolean = false, contentUrl: string | null = null) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.message = message;
        this.date = date;
        this.isRead = isRead;
        this.contentUrl = contentUrl;
    }
}

