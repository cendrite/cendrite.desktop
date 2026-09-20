export type Theme = 'system' | 'light' | 'dark' | 'gruvbox' | 'kanagawa';

export type ResolvedTheme = Exclude<Theme, 'system'>;

export const DEFAULT_THEME: Theme = 'dark';

// Whether a theme reads as light or dark to the platform: drives color-scheme,
// native form controls, and which side of 'system' resolves to it.
export const THEME_APPEARANCE: Record<ResolvedTheme, 'light' | 'dark'> = {
    light: 'light',
    dark: 'dark',
    gruvbox: 'dark',
    kanagawa: 'dark',
};

// Must match --color-canvas in index.css; the main process cannot read the stylesheet.
export const WINDOW_BACKGROUND: Record<ResolvedTheme, string> = {
    light: '#f4f3ef',
    dark: '#09090b',
    gruvbox: '#1d2021',
    kanagawa: '#16161d',
};
