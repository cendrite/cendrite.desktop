import {EntitySchema} from "typeorm";
import {Friend} from "../../Domain/Aggregates/Friend.js";
import {ConnectionId} from "../../Domain/Entities/ConnectionId.js";

export const FriendSchema =new EntitySchema<Friend>({
    name: "Friend",
    target: Friend,
    columns: {
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
        profilePicture: {
            type: "blob",
            nullable: true
        }
    },
    relations: {
        connectionIds: {
            target: () => ConnectionId,
            type: "one-to-many",
            inverseSide: "friend",
            cascade: true,
            eager: true
        },
    }
});