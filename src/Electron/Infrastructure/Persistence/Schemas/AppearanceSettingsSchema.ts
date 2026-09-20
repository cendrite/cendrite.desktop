import { EntitySchema } from 'typeorm';
import { BaseSchema } from './BaseSchema.js';
import { AppearanceSettingsRecord } from '../../../Domain/Entities/AppearanceSettingsRecord.js';

export const AppearanceSettingsSchema = new EntitySchema<AppearanceSettingsRecord>({
    name: 'AppearanceSettings',
    tableName: 'appearance_settings',
    target: AppearanceSettingsRecord,
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
