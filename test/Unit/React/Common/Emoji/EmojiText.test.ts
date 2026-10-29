import { describe, expect, test } from 'vitest';
import { countEmojiOnly, isJumboEmoji } from '../../../../../src/React/Common/Emoji/EmojiText.ts';

describe('countEmojiOnly', () => {
    test.each([
        ['😀', 1],
        ['😀😀', 2],
        [' 😀 🎉 ', 2],
        ['❤️', 1],
        ['👍🏽', 1],
        ['👨‍👩‍👧‍👦', 1],
        ['🏳️‍🌈', 1],
        ['🇩🇰', 1],
        ['1️⃣', 1],
    ])('counts %s as %i', (text, expected) => {
        expect(countEmojiOnly(text)).toBe(expected);
    });

    test.each(['', '   ', 'hi', 'hi 😀', '😀!', '123', '©', '™'])('returns 0 for %j', (text) => {
        expect(countEmojiOnly(text)).toBe(0);
    });

    test('handles missing text', () => {
        expect(countEmojiOnly(null)).toBe(0);
        expect(countEmojiOnly(undefined)).toBe(0);
    });
});

describe('isJumboEmoji', () => {
    test('enlarges up to three emoji', () => {
        expect(isJumboEmoji('😀')).toBe(true);
        expect(isJumboEmoji('😀😀😀')).toBe(true);
        expect(isJumboEmoji('😀😀😀😀')).toBe(false);
        expect(isJumboEmoji('hello')).toBe(false);
    });
});
