import {ChatMember} from "../../../Domain/Entities/ChatMember.js";
import {EntitySchema} from "typeorm";
import {BaseSchema} from "./BaseSchema.js";
import {ChatPrivileges} from "../../../Domain/Enums/ChatPrivileges.js";
import {Friend} from "../../../Domain/Aggregates/Friend.js";
import { Chat } from "../../../Domain/Aggregates/Chat.js";

export const ChatMemberSchema = new EntitySchema<ChatMember>({
    name: "ChatMember",
    target: ChatMember,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: "uuid",
            primary: true,
        },
        privilege: {
            type: "integer",
            enum: ChatPrivileges
        },
        displayName: {
            type: "text",
            nullable: true
        },
        // Nullable because synchronize cannot add a non-null column to a populated table; it is backfilled on startup.
        userTag: {
            type: "text",
            nullable: true
        },
        connectionIds: {
            type: "simple-json",
            nullable: true
        },
        avatarKey: {
            type: "text",
            nullable: true
        }
    },
    relations: {
        friend: {
            target: () => Friend,
            type: "many-to-one",
            joinColumn: true,
            cascade: true,
            nullable: true,
            // Deleting a friend must not delete them from every group chat, so the link is cleared instead.
            onDelete: "SET NULL",
            eager: true,
        },
        chat: {
            target: () => Chat,
            type: "many-to-one",
            inverseSide: "members",
            joinColumn: true,
            onDelete: "CASCADE",
            eager: false,
        }
    }
})
