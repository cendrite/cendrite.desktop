import React from 'react';
import { Theme } from '../../../../Shared/Theme.ts';

interface ThemePreviewProps {
    theme: Theme;
}

const Plate: React.FC<{ dark: boolean }> = ({ dark }) => (
    <div className={`flex h-full w-full ${dark ? 'bg-zinc-950' : 'bg-white'}`}>
        <div className={`w-3 shrink-0 ${dark ? 'bg-darkGray-500' : 'bg-gray-200'}`} />

        <div className="flex flex-1 flex-col justify-center gap-1 p-2">
            <div className={`h-1.5 w-2/3 rounded-full ${dark ? 'bg-gray-200' : 'bg-gray-300'}`} />
            <div className="h-1.5 w-1/2 self-end rounded-full bg-blue-500" />
        </div>
    </div>
);

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
    if (theme !== 'system') {
        return <Plate dark={theme === 'dark'} />;
    }

    return (
        <div className="flex h-full w-full">
            <div className="w-1/2 overflow-hidden">
                <div className="h-full w-[200%]">
                    <Plate dark={false} />
                </div>
            </div>
            <div className="w-1/2 overflow-hidden">
                <div className="h-full w-[200%] -translate-x-1/2">
                    <Plate dark={true} />
                </div>
            </div>
        </div>
    );
};

export default ThemePreview;
