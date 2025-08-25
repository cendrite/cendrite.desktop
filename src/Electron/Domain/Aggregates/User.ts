
export class User {
    id!: string;
    username!: string;
    userTag!: string;
    profilePicture: Buffer | null;
    displayName: string | null;

    constructor(id: string, username: string, userTag: string, profilePicture: Buffer | null, displayName: string | null) {
        this.id = id;
        this.username = username;
        this.userTag = userTag;
        this.profilePicture = profilePicture;
        this.displayName = displayName;
    }

    public setProfilePicture(profilePicture: Buffer) {
        this.profilePicture = profilePicture;
    }

    public setDisplayName(displayName: string) {
        this.displayName = displayName;
    }
}