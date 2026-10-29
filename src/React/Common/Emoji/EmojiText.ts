const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

const EMOJI_GRAPHEME = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️|⃣/u;

export const MAX_JUMBO_EMOJI = 3;

export function countEmojiOnly(text: string | null | undefined): number {
    if (!text) return 0;

    let count = 0;
    for (const { segment } of segmenter.segment(text)) {
        if (/^\s+$/u.test(segment)) continue;
        if (!EMOJI_GRAPHEME.test(segment)) return 0;
        count++;
    }
    return count;
}

export function isJumboEmoji(text: string | null | undefined): boolean {
    const count = countEmojiOnly(text);
    return count > 0 && count <= MAX_JUMBO_EMOJI;
}
