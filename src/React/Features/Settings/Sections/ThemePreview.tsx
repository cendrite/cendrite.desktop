import React from 'react';
import { ResolvedTheme, Theme } from '../../../../Shared/Theme.ts';

interface ThemePreviewProps {
    theme: Theme;
}

// Re-declaring data-theme on a wrapper re-resolves the tokens for its subtree,
// so each preview renders in its own theme regardless of the active one.
const Plate: React.FC<{ appearance: ResolvedTheme }> = ({ appearance }) => (
    <div data-theme={appearance} className="flex h-full w-full bg-canvas">
        <div className="w-3 shrink-0 bg-surface" />

        <div className="flex flex-1 flex-col justify-center gap-1 p-2">
            <div className="h-1.5 w-2/3 rounded-full bg-fg-muted" />
            <div className="h-1.5 w-1/2 self-end rounded-full bg-accent" />
        </div>
    </div>
);

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
    if (theme !== 'system') {
        return <Plate appearance={theme} />;
    }

    return (
        <div className="flex h-full w-full">
            <div className="w-1/2 overflow-hidden">
                <div className="h-full w-[200%]">
                    <Plate appearance="light" />
                </div>
            </div>
            <div className="w-1/2 overflow-hidden">
                <div className="h-full w-[200%] -translate-x-1/2">
                    <Plate appearance="dark" />
                </div>
            </div>
        </div>
    );
};

export default ThemePreview;
