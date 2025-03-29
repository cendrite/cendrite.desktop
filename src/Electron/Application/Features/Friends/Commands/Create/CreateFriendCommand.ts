export class CreateFriendCommand implements MediatorRequest {
    type = "CreateFriendCommand";
    username!: string;
    displayName: string | null;
    base64ProfilePicture: string | null;
    connectionId!: string[];
    tag!: string;

    constructor(username: string, displayName: string | null, connectionId: string[], tag: string, base64Url: string | null) {
        this.username = username;
        this.displayName = displayName;
        this.base64ProfilePicture = base64Url;
        this.connectionId = connectionId;
        this.tag = tag;
    }
}
