export type EmojiSettings = {
    skinTones: Record<string, string>;
    recent: string[];
};

export const defaultEmojiSettings: EmojiSettings = {
    skinTones: {},
    recent: [],
};
