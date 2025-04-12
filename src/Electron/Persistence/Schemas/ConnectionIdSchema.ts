import {EntitySchema} from "typeorm";
import {ConnectionId} from "../../Domain/Entities/ConnectionId.js";
import {Friend} from "../../Domain/Aggregates/Friend.js";

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
    relations: {
        friend: {
            type: "many-to-one",
            target: () => Friend,
            joinColumn: true,
            inverseSide: "connectionIds",
            onDelete: "CASCADE"
        }
    }
});