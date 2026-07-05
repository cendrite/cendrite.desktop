import { EntitySchema } from 'typeorm/entity-schema/EntitySchema.js';
import { Message } from '../../Domain/Entities/Message.js';
import { MessageMedia } from '../../Domain/Entities/MessageMedia.js';
import { BaseSchema } from './BaseSchema.js';

export const MessageMediaSchema = new EntitySchema<MessageMedia>({
    name: 'MessageMedia',
    target: MessageMedia,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: String,
            primary: true,
        },
        type: {
            type: String,
        },
    },
    relations: {
        message: {
            type: 'many-to-one',
            target: () => Message,
            joinColumn: true,
            onDelete: 'CASCADE',
        },
    },
});
