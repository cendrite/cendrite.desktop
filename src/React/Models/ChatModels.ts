import { Contact } from "../Context/ContactContext";

export class Message {
    senderId: string;
    message: string;
    contentUrl: string | null;
    date: Date;
    isRead: boolean;

    constructor(senderId: string, message: string, date: Date, isRead: boolean = false, contentUrl: string | null = null) {
        this.senderId = senderId;
        this.message = message;
        this.date = date;
        this.isRead = isRead;
        this.contentUrl = contentUrl;
    }
}
export class Chat{
    id: string;
    contact: Contact[];
    lastMessage: string;
    lastMessageDate: Date;
    unreadMessages: number = 0;
    isPinned: boolean;
    isArchived: boolean;
    messages: Message[];

    constructor(id: string, contact: Contact[], lastMessage: string,  messages: Message[], isPinned: boolean, isArchived: boolean){
        this.id = id;
        this.contact = contact;
        this.lastMessage = lastMessage;
        this.isPinned = isPinned;
        this.isArchived = isArchived;
        this.lastMessageDate = this.getLastMessageDate(messages);
        this.unreadMessages = this.getUnreadMessageCount(messages);
        this.messages = messages;
    }

    private  getUnreadMessageCount(messages: Message[]): number {
        return messages.reduce((count, message) => message.isRead ? count : count + 1, 0);
    }

    private getLastMessageDate(messages: Message[]): Date {
        return messages.length > 0 ? messages[messages.length - 1].date : new Date();
    }
}
