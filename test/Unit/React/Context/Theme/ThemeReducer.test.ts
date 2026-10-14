import { describe, expect, test } from 'vitest';
import {
    initialThemeState,
    ThemeAction,
    resolveTheme,
    ThemeActionType,
    themeReducer,
} from '../../../../../src/React/Context/Theme/ThemeReducer.ts';

describe('themeReducer', () => {
    test('setting the theme replaces it and leaves the system preference alone', () => {
        const state = themeReducer(initialThemeState, { type: ThemeActionType.SetTheme, payload: 'gruvbox' });

        expect(state).toEqual({ ...initialThemeState, theme: 'gruvbox' });
    });

    test('setting the system preference replaces it and leaves the theme alone', () => {
        const state = themeReducer(initialThemeState, {
            type: ThemeActionType.SetSystemPrefersDark,
            payload: false,
        });

        expect(state).toEqual({ ...initialThemeState, systemPrefersDark: false });
    });

    test('an unknown action throws', () => {
        const unknown = { type: 99 } as unknown as ThemeAction;

        expect(() => themeReducer(initialThemeState, unknown)).toThrow('Unknown action type in ThemeReducer');
    });

    test('does not mutate the state it was given', () => {
        const before = { ...initialThemeState };

        themeReducer(before, { type: ThemeActionType.SetTheme, payload: 'light' });

        expect(before).toEqual(initialThemeState);
    });
});

describe('resolveTheme', () => {
    test('system resolves to dark when the system prefers dark', () => {
        expect(resolveTheme({ theme: 'system', systemPrefersDark: true })).toBe('dark');
    });

    test('system resolves to light when the system does not prefer dark', () => {
        expect(resolveTheme({ theme: 'system', systemPrefersDark: false })).toBe('light');
    });

    test.each(['light', 'dark', 'gruvbox', 'gruvbox-light', 'kanagawa', 'rose-pine'] as const)(
        'an explicit %s theme ignores the system preference',
        (theme) => {
            expect(resolveTheme({ theme, systemPrefersDark: true })).toBe(theme);
            expect(resolveTheme({ theme, systemPrefersDark: false })).toBe(theme);
        },
    );
});
