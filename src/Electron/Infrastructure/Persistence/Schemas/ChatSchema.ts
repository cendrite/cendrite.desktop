import {EntitySchema} from "typeorm";
import {Chat} from "#electron/Domain/Aggregates/Chat";
import {BaseSchema} from "./BaseSchema.js";
import {ChatMember} from "#electron/Domain/Entities/ChatMember";
import {Message} from "#electron/Domain/Entities/Message";

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
