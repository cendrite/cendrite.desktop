import {User} from "#electron/Domain/Aggregates/User";
import {EntitySchema} from "typeorm";
import {BaseSchema} from "./BaseSchema.js";
import {UserConnectionId} from "#electron/Domain/Entities/UserConnectionId";

export const UserSchema = new EntitySchema<User>({
    name: "User",
    target: User,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: "uuid",
            primary: true,
        },
        username: {
            type: "text",
            unique: true
        },
        userTag: {
            type: "text",
            unique: true
        },
        avatarKey: {
            type: "text",
            nullable: true
        },
        displayName: {
            type: "text",
            nullable: true
        }
    },
    relations: {
        connectionIds: {
            target: () => UserConnectionId,
            type: "one-to-many",
            inverseSide: "user",
            cascade: true,
            eager: true
        },
    }
})
