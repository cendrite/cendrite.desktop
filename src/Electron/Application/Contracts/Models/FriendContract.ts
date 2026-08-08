export class FriendContract {
    public readonly id: string;
    public readonly username: string;
    public readonly displayName: string | null;
    public readonly avatarKey: string | null;
    public readonly connectionIds: string[];

    constructor(
        id: string,
        username: string,
        displayName: string | null,
        avatarKey: string | null,
        connectionIds: string[],
    ) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatarKey = avatarKey;
        this.connectionIds = connectionIds;
    }
}
