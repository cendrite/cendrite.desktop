import { SettingsSection } from '#shared/Enums/SettingsSection';
import { SettingsDocument } from '#shared/Settings/SettingsDocument';
import { defaultAppearanceSettings } from '#shared/Settings/AppearanceSettings';
import { defaultEmojiSettings } from '#shared/Settings/EmojiSettings';

export const settingsDefaults: Record<SettingsSection, SettingsDocument> = {
    appearance: defaultAppearanceSettings,
    emoji: defaultEmojiSettings,
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
