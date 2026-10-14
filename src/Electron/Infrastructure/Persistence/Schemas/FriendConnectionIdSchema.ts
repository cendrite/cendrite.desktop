import {EntitySchema} from "typeorm";
import {Friend} from "#electron/Domain/Aggregates/Friend";
import {FriendConnectionId} from "#electron/Domain/Entities/FriendConnectionId";

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