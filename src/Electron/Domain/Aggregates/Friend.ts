import {FriendConnectionId} from "../Entities/FriendConnectionId.js";

export class Friend {
    id!: string;
    username!: string;
    displayName?: string | null;
    profilePicture!: Buffer | null;
    connectionIds!: FriendConnectionId[];
}