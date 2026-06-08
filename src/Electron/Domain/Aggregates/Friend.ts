import {FriendConnectionId} from "../Entities/FriendConnectionId.js";

export class Friend {
    id!: string;
    username!: string;
    displayName?: string | null;
    avatarKey!: string | null;
    connectionIds!: FriendConnectionId[];
}
