import { DEFAULT_THEME, Theme } from '../../../../../Shared/Theme.js';

export type AppearanceSettings = {
    theme: Theme;
};

export const defaultAppearanceSettings: AppearanceSettings = {
    theme: DEFAULT_THEME,
};
