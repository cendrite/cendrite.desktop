import {Friend} from "../Aggregates/Friend.js";

export class ConnectionId {
    id!: string;
    connectionId: string;
    friend!: Friend;

    constructor(connectionId: string) {
        this.connectionId = connectionId;
    }
}
