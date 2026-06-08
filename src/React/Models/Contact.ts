export class Contact {
    id: string;
    username: string;
    displayName: string | null;
    avatarKey: string | null;
    connectionIds: string[];

    constructor(
        id: string,
        username: string,
        displayName: string | null,
        profilePicture: string | null,
        connectionIds: string[],
    ) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatarKey = profilePicture;
        this.connectionIds = connectionIds;
    }
}
