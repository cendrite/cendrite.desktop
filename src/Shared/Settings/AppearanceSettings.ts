import { DEFAULT_THEME, Theme } from '../Theme.js';

export type AppearanceSettings = {
    theme: Theme;
    showMenuBar: boolean;
};

export const defaultAppearanceSettings: AppearanceSettings = {
    theme: DEFAULT_THEME,
    showMenuBar: true,
};
