import {UserConnectionId} from "../Entities/UserConnectionId.js";

export class User {
    id: string;
    username: string;
    userTag: string;
    profilePicture: Buffer | null;
    displayName: string | null;
    connectionIds: UserConnectionId[]

    constructor(id: string, username: string, userTag: string, connectionIds: UserConnectionId[], profilePicture: Buffer | null, displayName: string | null) {
        this.id = id;
        this.username = username;
        this.userTag = userTag;
        this.profilePicture = profilePicture;
        this.displayName = displayName;
        this.connectionIds = connectionIds;
    }

    public setProfilePicture(profilePicture: Buffer) {
        this.profilePicture = profilePicture;
    }

    public setDisplayName(displayName: string) {
        this.displayName = displayName;
    }
}