import { SettingsSection } from '#shared/Enums/SettingsSection';

export type SettingsScope = 'device' | 'account';

export const settingsScopes: Record<SettingsSection, SettingsScope> = {
    appearance: 'device',
    emoji: 'account',
};
