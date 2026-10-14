import { SettingsSection } from '../../../../Shared/Contracts/Enums/SettingsSection.js';

export type SettingsScope = 'device' | 'account';

export const settingsScopes: Record<SettingsSection, SettingsScope> = {
    appearance: 'device',
};
