import { SettingsSection } from '../../../../Shared/Enums/SettingsSection.js';

export type SettingsScope = 'device' | 'account';

export const settingsScopes: Record<SettingsSection, SettingsScope> = {
    appearance: 'device',
};
