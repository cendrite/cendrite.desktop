const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

// Emoji_Presentation alone would miss text-default symbols the picker sends with VS16 (❤️),
// while plain Extended_Pictographic would also match bare ©, ™ and digits.
const EMOJI_GRAPHEME = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️|⃣/u;

export const MAX_JUMBO_EMOJI = 3;

// Number of emoji when the text is nothing but emoji (whitespace ignored), otherwise 0.
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
