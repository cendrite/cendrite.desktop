import { EntitySchema } from 'typeorm';
import { BaseSchema } from './BaseSchema.js';
import { NotificationSettingsRecord } from '#electron/Domain/Entities/NotificationSettingsRecord';

export const NotificationSettingsSchema = new EntitySchema<NotificationSettingsRecord>({
    name: 'NotificationSettings',
    tableName: 'notification_settings',
    target: NotificationSettingsRecord,
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
