export class PendingContact {
    id: string;
    username: string;
    displayName: string | null;
    avatarKey: string | null;
    IsSeen: boolean = false;

    constructor(
        id: string,
        username: string,
        isSeen: boolean,
        displayName: string | null,
        avatarKey: string | null,
    ) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatarKey = avatarKey;
        this.IsSeen = isSeen;
    }
}
