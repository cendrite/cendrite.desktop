import React from 'react';
import type { SkinTone } from 'frimousse';

export interface EmojiSettingsContextType {
    skinTone: SkinTone;
    recent: string[];
    setSkinTone: (skinTone: SkinTone) => void;
    recordUsage: (emoji: string) => void;
}

export const EmojiSettingsContext = React.createContext<EmojiSettingsContextType | undefined>(undefined);

export const useEmojiSettings = (): EmojiSettingsContextType => {
    const context = React.useContext(EmojiSettingsContext);
    if (context === undefined) {
        throw new Error('useEmojiSettings must be used within an EmojiSettingsProvider');
    }
    return context;
};
