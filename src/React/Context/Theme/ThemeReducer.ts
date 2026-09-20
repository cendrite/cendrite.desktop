import { DEFAULT_THEME, ResolvedTheme, Theme } from '../../../Shared/Theme.ts';

export enum ThemeActionType {
    SetTheme,
    SetSystemPrefersDark,
}

export type ThemeAction =
    | { type: ThemeActionType.SetTheme; payload: Theme }
    | { type: ThemeActionType.SetSystemPrefersDark; payload: boolean };

export interface ThemeState {
    theme: Theme;
    systemPrefersDark: boolean;
}

export const initialThemeState: ThemeState = {
    theme: DEFAULT_THEME,
    systemPrefersDark: true,
};

export function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
    switch (action.type) {
        case ThemeActionType.SetTheme:
            return { ...state, theme: action.payload };
        case ThemeActionType.SetSystemPrefersDark:
            return { ...state, systemPrefersDark: action.payload };
        default:
            return state;
    }
}

export function resolveTheme(state: ThemeState): ResolvedTheme {
    if (state.theme === 'system') {
        return state.systemPrefersDark ? 'dark' : 'light';
    }
    return state.theme;
}
