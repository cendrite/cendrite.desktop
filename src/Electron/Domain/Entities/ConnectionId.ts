import {BaseEntity} from "../../Persistence/Entities/BaseEntity.js";

export class ConnectionId extends BaseEntity {
    id!: string;

    connectionId: string;

    constructor(connectionId: string) {
        super();
        this.connectionId = connectionId;
    }
}
