export type EmojiSettings = {
    skinTone: string;
    recent: string[];
};

export const defaultEmojiSettings: EmojiSettings = {
    skinTone: 'none',
    recent: [],
};
