import {BaseEntity} from "../../Persistence/Entities/BaseEntity.js";
import {Friend} from "../Aggregates/Friend.js";

export class ConnectionId extends BaseEntity {
    id!: string;

    connectionId: string;

    friend!: Friend;

    constructor(connectionId: string) {
        super();
        this.connectionId = connectionId;
    }
}
