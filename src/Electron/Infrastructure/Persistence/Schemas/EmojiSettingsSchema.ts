import { EntitySchema } from 'typeorm';
import { BaseSchema } from './BaseSchema.js';
import { EmojiSettingsRecord } from '#electron/Domain/Entities/EmojiSettingsRecord';

export const EmojiSettingsSchema = new EntitySchema<EmojiSettingsRecord>({
    name: 'EmojiSettings',
    tableName: 'emoji_settings',
    target: EmojiSettingsRecord,
    columns: {
        ...BaseSchema.columns,
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        value: {
            type: 'text',
        },
    },
});
