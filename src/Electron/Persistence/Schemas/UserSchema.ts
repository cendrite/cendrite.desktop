import {User} from "../../Domain/Aggregates/User.js";
import {EntitySchema} from "typeorm";
import {BaseSchema} from "./BaseSchema.js";
import {FriendConnectionId} from "../../Domain/Entities/FriendConnectionId.js";
import {UserConnectionId} from "../../Domain/Entities/UserConnectionId.js";

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
        profilePicture: {
            type: "blob",
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