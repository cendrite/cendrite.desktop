export class User {
    id: string;
    username: string;
    userTag: string;
    deviceId: string;
    connectionId: string;
    externalConnectionIds: string[];
    base64ProfilePicture: string | null;
    displayName: string | null;

    constructor(
        id: string,
        username: string,
        userTag: string,
        deviceId: string,
        connectionId: string,
        externalConnectionIds: string[],
        base64ProfilePicture: string | null,
        displayName: string | null,
    ) {
        this.id = id;
        this.username = username;
        this.userTag = userTag;
        this.deviceId = deviceId;
        this.connectionId = connectionId;
        this.externalConnectionIds = externalConnectionIds;
        this.base64ProfilePicture = base64ProfilePicture;
        this.displayName = displayName;
    }

    public IsUserConnectionId(connectionId: string): boolean {
        return this.connectionId === connectionId || this.externalConnectionIds.includes(connectionId);
    }
}
