import React from 'react';
import { ResolvedTheme, Theme } from '../../../Shared/Theme.ts';

export interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
    const context = React.useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
