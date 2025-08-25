import {ConnectionId} from "../Entities/ConnectionId.js";

export class Friend {
    id!: string;
    username!: string;
    displayName?: string | null;
    profilePicture!: Buffer | null;
    connectionIds!: ConnectionId[];
}