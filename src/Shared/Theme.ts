export type Theme = 'light' | 'dark' | 'system';

export type ResolvedTheme = 'light' | 'dark';

export const DEFAULT_THEME: Theme = 'dark';

// Must match --color-canvas in index.css; the main process cannot read the stylesheet.
export const WINDOW_BACKGROUND: Record<ResolvedTheme, string> = {
    dark: '#09090b',
    light: '#ffffff',
};
