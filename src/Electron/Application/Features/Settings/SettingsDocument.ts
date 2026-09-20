import { SettingsSection } from '../../Contracts/Settings/SettingsSection.js';
import { defaultAppearanceSettings } from './Appearance/AppearanceSettings.js';

export type SettingsDocument = Record<string, unknown>;

export const settingsDefaults: Record<SettingsSection, SettingsDocument> = {
    appearance: defaultAppearanceSettings,
};

export function parseSettings(section: SettingsSection, stored: string | null): SettingsDocument {
    return { ...settingsDefaults[section], ...safeParse(stored) };
}

// A missing, corrupt or newer-shaped row degrades to defaults rather than failing the read.
function safeParse(stored: string | null): SettingsDocument {
    if (!stored) {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(stored);
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? (parsed as SettingsDocument)
            : {};
    } catch {
        return {};
    }
}
