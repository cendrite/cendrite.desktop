import { DEFAULT_THEME, Theme } from '#shared/Theme';

export type AppearanceSettings = {
    theme: Theme;
};

export const defaultAppearanceSettings: AppearanceSettings = {
    theme: DEFAULT_THEME,
};
