import {Friend} from "../Aggregates/Friend.js";

export class ConnectionId {
    id!: string;
    connectionId: string;
    friend: Friend;

    constructor(connectionId: string, friend: Friend) {
        this.connectionId = connectionId;
        this.friend = friend;
    }
}
