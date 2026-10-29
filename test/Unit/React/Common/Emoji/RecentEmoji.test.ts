import { describe, expect, test } from 'vitest';
import { parseRecentEmoji, pushRecentEmoji } from '../../../../../src/React/Common/Emoji/RecentEmoji.ts';

describe('pushRecentEmoji', () => {
    test('puts the newest emoji first', () => {
        expect(pushRecentEmoji(['😀', '🎉'], '🔥')).toEqual(['🔥', '😀', '🎉']);
    });

    test('moves a re-used emoji to the front instead of duplicating it', () => {
        expect(pushRecentEmoji(['😀', '🎉', '🔥'], '🔥')).toEqual(['🔥', '😀', '🎉']);
    });

    test('drops the oldest beyond the limit', () => {
        expect(pushRecentEmoji(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
    });

    test('does not mutate the input', () => {
        const recent = ['😀'];
        pushRecentEmoji(recent, '🔥');
        expect(recent).toEqual(['😀']);
    });
});

describe('parseRecentEmoji', () => {
    test('accepts a list of strings', () => {
        expect(parseRecentEmoji(['😀', '🔥'])).toEqual(['😀', '🔥']);
    });

    test.each([undefined, null, 'x', 1, {}])('falls back to empty for %j', (value) => {
        expect(parseRecentEmoji(value)).toEqual([]);
    });

    test('drops invalid entries and caps the length', () => {
        expect(parseRecentEmoji(['😀', 2, '', null, '🔥', '🎉'], 2)).toEqual(['😀', '🔥']);
    });
});
