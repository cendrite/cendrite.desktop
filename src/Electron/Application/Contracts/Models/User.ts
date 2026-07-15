export class User {
    id: string;
    username: string;
    tag: string;
    deviceId: string;
    connectionId: string;
    externalConnectionIds: string[];
    avatarKey: string | null;
    displayName: string | null;

    constructor(
        id: string,
        username: string,
        tag: string,
        deviceId: string,
        connectionId: string,
        externalConnectionIds: string[],
        avatarKey: string | null = null,
        displayName: string | null = null,
    ) {
        this.id = id;
        this.username = username;
        this.tag = tag;
        this.deviceId = deviceId;
        this.connectionId = connectionId;
        this.externalConnectionIds = externalConnectionIds;
        this.avatarKey = avatarKey;
        this.displayName = displayName;
    }
}
