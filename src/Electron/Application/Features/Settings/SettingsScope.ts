import { SettingsSection } from '#shared/Enums/SettingsSection';

export type SettingsScope = 'device' | 'account';

export const settingsScopes: Record<SettingsSection, SettingsScope> = {
    appearance: 'device',
    // Usage history stays on this device only and is wiped with the account's data.
    emoji: 'account',
};
