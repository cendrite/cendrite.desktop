import {EntitySchema} from "typeorm";
import {Friend} from "../../Domain/Aggregates/Friend.js";
import {FriendConnectionId} from "../../Domain/Entities/FriendConnectionId.js";

export const FriendConnectionIdSchema = new EntitySchema<FriendConnectionId>({
    name: "FriendConnectionId",
    target: FriendConnectionId,
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: 'uuid'
        },
        connectionId: {
            type: String,
            nullable: false,
        }
    },
    relations: {
        friend: {
            target: () => Friend,
            type: "many-to-one",
            joinColumn: true,
            inverseSide: "connectionIds",
            onDelete: "CASCADE",
            orphanedRowAction: "delete"
        }
    }
});