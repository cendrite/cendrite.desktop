import {Message} from "../../Domain/Entities/Message.js";
import {EntitySchema} from "typeorm";
import {Chat} from "../../Domain/Aggregates/Chat.js";

export const MessageSchema = new EntitySchema<Message>({
    name: "Message",
    target: Message,
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: 'uuid'
        },
        messageToken: {
            type: "uuid",
            nullable: true
        },
        senderId: {
            type: "uuid",
            nullable: false
        },
        content: {
            type: "text",
            nullable: false
        },
        contentUrl: {
            type: "text",
            nullable: true
        },
        deliveryStatus: {
            type: "integer",
            nullable: false,
        },
        timestamp: {
            type: "datetime",
            default: () => "datetime('now')",
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value)
            }
        },
    },
    relations: {
        chat: {
            type: "many-to-one",
            target: () => Chat,
            joinColumn: true,
            inverseSide: "messages",
            onDelete: "CASCADE"
        }
    }
})