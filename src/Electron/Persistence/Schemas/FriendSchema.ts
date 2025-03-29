import {EntitySchema} from "typeorm";
import {Friend} from "../../Domain/Aggregates/Friend.js";

export const FriendSchema =new EntitySchema<Friend>({
    name: "Friend",
    target: Friend,
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: 'uuid'
        },
        username: {
            type: String
        },
        displayName: {
            type: String,
            nullable: true
        },
        profilePicture: {
            type: "blob",
            nullable: true
        },
        tag: {
            type: String
        }
    },
    relations: {
        connectionIds: {
            target: "ConnectionId",
            type: "one-to-many",
            cascade: true,
            eager: true
        },
    }
});