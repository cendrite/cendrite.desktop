export class PendingContact {
    id: string;
    username: string;
    displayName: string | null;
    profilePicture: string | null;
    IsSeen: boolean = false;

    constructor(
        id: string,
        username: string,
        isSeen: boolean,
        displayName: string | null,
        profilePicture: string | null,
    ) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.profilePicture = profilePicture;
        this.IsSeen = isSeen;
    }
}
