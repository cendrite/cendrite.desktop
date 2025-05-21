import {ChatMember} from "../../Domain/Entities/ChatMember.js";
import {EntitySchema} from "typeorm";
import {BaseSchema} from "./BaseSchema.js";
import {ChatPrivileges} from "../../Domain/Enums/ChatPrivileges.js";
import {Friend} from "../../Domain/Aggregates/Friend.js";

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
        }
    },
    relations: {
        friend: {
            target: () => Friend,
            type: "many-to-one",
            joinColumn: true,
            cascade: true
        }
    }
})