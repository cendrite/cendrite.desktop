import {EntitySchema} from "typeorm";
import {Friend} from "#electron/Domain/Aggregates/Friend";
import { BaseSchema } from "./BaseSchema.js";
import {FriendConnectionId} from "#electron/Domain/Entities/FriendConnectionId";

export const FriendSchema =new EntitySchema<Friend>({
    name: "Friend",
    target: Friend,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: "text",
            primary: true,
        },
        username: {
            type: String
        },
        displayName: {
            type: String,
            nullable: true
        },
        avatarKey: {
            type: "text",
            nullable: true
        }
    },
    relations: {
        connectionIds: {
            target: () => FriendConnectionId,
            type: "one-to-many",
            inverseSide: "friend",
            cascade: true,
            eager: true
        },
    }
});
