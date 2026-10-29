import React from 'react';

export interface EmojiSettingsContextType {
    skinTones: Readonly<Record<string, string>>;
    recent: string[];
    setSkinTone: (emoji: string, variant: string) => void;
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
