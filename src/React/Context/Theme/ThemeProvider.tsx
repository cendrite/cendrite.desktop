import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { ThemeContext } from './ThemeContext.tsx';
import { initialThemeState, resolveTheme, ThemeActionType, themeReducer, ThemeState } from './ThemeReducer.ts';
import { Theme, THEME_APPEARANCE } from '../../../Shared/Theme.ts';
import { UpdateSettingsCommand } from '../../../Electron/Application/Features/Settings/Contracts/UpdateSettings.ts';

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

// The main process resolves the stored theme before the window exists and passes it through
// the preload, so the first render already paints the right theme without an IPC round trip.
const readInitialState = (): ThemeState => ({
    theme: window.electron.initialTheme,
    systemPrefersDark: window.matchMedia(SYSTEM_DARK_QUERY).matches,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, themeDispatch] = useReducer(themeReducer, initialThemeState, readInitialState);
    const resolvedTheme = resolveTheme(state);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        document.documentElement.style.colorScheme = THEME_APPEARANCE[resolvedTheme];
    }, [resolvedTheme]);

    useEffect(() => {
        const query = window.matchMedia(SYSTEM_DARK_QUERY);
        const onChange = (event: MediaQueryListEvent) =>
            themeDispatch({ type: ThemeActionType.SetSystemPrefersDark, payload: event.matches });

        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);

    const setTheme = useCallback((theme: Theme) => {
        themeDispatch({ type: ThemeActionType.SetTheme, payload: theme });
        // Fire and forget: a failed write must not revert what the user just picked.
        void window.electron.sendRequestAsync(new UpdateSettingsCommand('appearance', { theme }));
    }, []);

    const value = useMemo(
        () => ({ theme: state.theme, resolvedTheme, setTheme }),
        [state.theme, resolvedTheme, setTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
