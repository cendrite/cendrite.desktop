import {EntitySchema} from "typeorm";
import {Chat} from "../../Domain/Aggregates/Chat.js";
import {BaseSchema} from "./BaseSchema.js";
import {ChatMember} from "../../Domain/Entities/ChatMember.js";
import {Message} from "../../Domain/Entities/Message.js";

export const ChatSchema = new EntitySchema<Chat>({
    name: "Chat",
    target: Chat,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: "uuid",
            primary: true,
            generated: 'uuid'
        },
        groupId: {
            type: "uuid",
            nullable: true,
        },
        groupName: {
            type: "text",
            nullable: true,
        },
        messageTtl: {
            type: "integer",
            nullable: true,
        },
        muted: {
            type: "boolean",
            default: false,
        },
        muteTimer: {
            type: "integer",
            nullable: true,
        },
    },
    relations: {
        members: {
            target: () => ChatMember,
            type: "one-to-many",
            inverseSide: "chat",
            cascade: true,
            eager: false,
        },
        messages: {
            target: () => Message,
            type: "one-to-many",
            inverseSide: "chat",
            cascade: true,
            eager: false,
        }
    }
});