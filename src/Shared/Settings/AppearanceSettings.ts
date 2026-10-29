import { DEFAULT_THEME, Theme } from '../Theme.js';

export type AppearanceSettings = {
    theme: Theme;
};

export const defaultAppearanceSettings: AppearanceSettings = {
    theme: DEFAULT_THEME,
};
