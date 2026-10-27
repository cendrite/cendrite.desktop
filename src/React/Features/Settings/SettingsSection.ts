export type SettingsSection = 'account' | 'appearance' | 'notifications' | 'privacy' | 'devices';

export interface SettingsSectionDescriptor {
    id: SettingsSection;
    label: string;
}

export const settingsSections: SettingsSectionDescriptor[] = [
    { id: 'account', label: 'Account' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'devices', label: 'Devices' },
];
