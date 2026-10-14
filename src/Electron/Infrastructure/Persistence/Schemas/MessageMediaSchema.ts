import { EntitySchema } from 'typeorm/entity-schema/EntitySchema.js';
import { Message } from '#electron/Domain/Entities/Message';
import { MessageMedia } from '#electron/Domain/Entities/MessageMedia';
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
