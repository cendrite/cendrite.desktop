import { EntitySchema } from 'typeorm/entity-schema/EntitySchema.js';
import { Message } from '../../Domain/Entities/Message.js';
import { Chat } from '../../Domain/Aggregates/Chat.js';
import { BaseSchema } from './BaseSchema.js';

export const MessageSchema = new EntitySchema<Message>({
    name: 'Message',
    target: Message,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: 'uuid',
            primary: true,
        },
        messageToken: {
            type: 'uuid',
            nullable: true,
        },
        senderId: {
            type: 'uuid',
            nullable: false,
        },
        content: {
            type: 'text',
            nullable: false,
        },
        contentUrl: {
            type: 'text',
            nullable: true,
        },
        deliveryStatus: {
            type: 'integer',
            nullable: false,
        },
        timestamp: {
            type: 'datetime',
            default: () => "datetime('now')",
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value),
            },
        },
        chatId: {
            type: 'uuid',
            nullable: false,
        },
    },
    relations: {
        chat: {
            type: 'many-to-one',
            target: () => Chat,
            joinColumn: {
                name: 'chatId',
                referencedColumnName: 'id',
            },
            inverseSide: 'messages',
            onDelete: 'CASCADE',
        },
    },
});
