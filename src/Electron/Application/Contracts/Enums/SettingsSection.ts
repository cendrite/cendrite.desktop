export type SettingsSection = 'appearance';

export type SettingsScope = 'device' | 'account';

export const settingsScopes: Record<SettingsSection, SettingsScope> = {
    appearance: 'device',
};
