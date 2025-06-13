export class ServerChatMessage {
    public id: string;
    public senderId: string;
    public recipientId: string;
    public messageToken: string | null;
    public content: string;

    constructor(id: string, senderId: string, recipientId: string, content: string, messageToken: string | null = null) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.messageToken = messageToken;
        this.content = content;
    }
}