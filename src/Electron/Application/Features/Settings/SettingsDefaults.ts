import { SettingsSection } from '../../../../Shared/Contracts/Enums/SettingsSection.js';
import { SettingsDocument } from '../../../../Shared/Contracts/Settings/SettingsDocument.js';
import { defaultAppearanceSettings } from './AppearanceSettings.js';

export const settingsDefaults: Record<SettingsSection, SettingsDocument> = {
    appearance: defaultAppearanceSettings,
};

export function parseSettings(section: SettingsSection, stored: string | null): SettingsDocument {
    return { ...settingsDefaults[section], ...safeParse(stored) };
}

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
