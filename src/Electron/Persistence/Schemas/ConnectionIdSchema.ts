import {EntitySchema} from "typeorm";
import {ConnectionId} from "../../Domain/Entities/ConnectionId.js";

export const ConnectionIdSchema = new EntitySchema<ConnectionId>({
    name: "ConnectionId",
    target: ConnectionId,
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: 'uuid'
        },
        connectionId: {
            type: String
        }
    },
});