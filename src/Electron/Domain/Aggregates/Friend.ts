import {ConnectionId} from "../Entities/ConnectionId.js";
import {BaseEntity} from "../../Persistence/Entities/BaseEntity.js";

export class Friend extends BaseEntity {
    id!: string;

    username!: string;

    displayName?: string | null;

    profilePicture?: Buffer | null;

    connectionIds!: ConnectionId[];

    tag!: string;

    constructor() {
        super();
    }
}