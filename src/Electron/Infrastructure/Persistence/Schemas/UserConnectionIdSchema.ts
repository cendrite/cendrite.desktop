import {EntitySchema} from "typeorm";
import {UserConnectionId} from "#electron/Domain/Entities/UserConnectionId";
import {User} from "#electron/Domain/Aggregates/User";

export const UserConnectionIdSchema =new EntitySchema<UserConnectionId>({
    name: "UserConnectionId",
    target: UserConnectionId,
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
        user: {
            target: () => User,
            type: "many-to-one",
            joinColumn: true,
            inverseSide: "connectionIds",
            onDelete: "CASCADE",
            orphanedRowAction: "delete"
        }
    }
});
