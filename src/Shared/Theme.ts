export type Theme = 'system' | 'light' | 'dark' | 'gruvbox' | 'gruvbox-light' | 'kanagawa' | 'rose-pine';

export type ResolvedTheme = Exclude<Theme, 'system'>;

export const DEFAULT_THEME: Theme = 'dark';

// Whether a theme reads as light or dark to the platform: drives color-scheme,
// native form controls, and which side of 'system' resolves to it.
export const THEME_APPEARANCE: Record<ResolvedTheme, 'light' | 'dark'> = {
    light: 'light',
    dark: 'dark',
    gruvbox: 'dark',
    'gruvbox-light': 'light',
    kanagawa: 'dark',
    'rose-pine': 'dark',
};

// Must match --color-canvas in index.css; the main process cannot read the stylesheet.
export const WINDOW_BACKGROUND: Record<ResolvedTheme, string> = {
    light: '#f4f3ef',
    dark: '#000000',
    gruvbox: '#1d2021',
    'gruvbox-light': '#fbf1c7',
    kanagawa: '#16161d',
    'rose-pine': '#191724',
};
