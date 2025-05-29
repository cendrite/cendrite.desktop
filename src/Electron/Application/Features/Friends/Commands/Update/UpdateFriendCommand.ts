export class UpdateFriendCommand implements MediatorRequest {
    type = "UpdateFriendCommand";
    id: string;
    username: string | null;
    displayName: string | null;
    profilePicture: string | null;
    constructor(
        id: string,
        username: string | null = null,
        displayName: string | null = null,
        profilePicture: string | null = null
    ) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.profilePicture = profilePicture;
    }
}