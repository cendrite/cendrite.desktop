import { createSettingsSchema } from './createSettingsSchema.js';
import { AppearanceSettingsRecord } from '../../../../Domain/Entities/Settings/AppearanceSettingsRecord.js';

export const AppearanceSettingsSchema = createSettingsSchema(
    'AppearanceSettings',
    'appearance_settings',
    AppearanceSettingsRecord,
);
