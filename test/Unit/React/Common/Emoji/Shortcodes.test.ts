import { describe, expect, test } from 'vitest';
import {
    emojiWithSkinTone,
    findClosedShortcode,
    findExactShortcode,
    findShortcodeQuery,
    replaceRange,
    searchShortcodes,
    type ShortcodeEntry,
} from '../../../../../src/React/Common/Emoji/Shortcodes.ts';

const grinning: ShortcodeEntry = { emoji: '😀', label: 'Grinning face', shortcodes: ['grinning', 'grinning_face'] };
const thumbsUp: ShortcodeEntry = {
    emoji: '👍',
    label: 'Thumbs up',
    shortcodes: ['+1', 'thumbsup', 'yes'],
    skins: { light: '👍🏻', medium: '👍🏽' },
};
const thinking: ShortcodeEntry = { emoji: '🤔', label: 'Thinking face', shortcodes: ['thinking'] };
const fire: ShortcodeEntry = { emoji: '🔥', label: 'Fire', shortcodes: ['fire'] };
const entries = [grinning, thumbsUp, thinking, fire];

describe('findShortcodeQuery', () => {
    test('finds a shortcode being typed at the caret', () => {
        expect(findShortcodeQuery('hello :thu', 10)).toEqual({ start: 6, query: 'thu' });
        expect(findShortcodeQuery(':fi', 3)).toEqual({ start: 0, query: 'fi' });
    });

    test('waits for at least two characters', () => {
        expect(findShortcodeQuery(':t', 2)).toBeNull();
    });

    test('only looks at text before the caret', () => {
        expect(findShortcodeQuery(':thu rest', 4)).toEqual({ start: 0, query: 'thu' });
        expect(findShortcodeQuery(':thu rest', 9)).toBeNull();
    });

    test.each(['12:30', 'https://x', 'a:bc', ': ab'])('ignores colons that do not start a word in %j', (text) => {
        expect(findShortcodeQuery(text, text.length)).toBeNull();
    });

    test('is case-insensitive', () => {
        expect(findShortcodeQuery(':FIre', 5)?.query).toBe('fire');
    });
});

describe('findClosedShortcode', () => {
    test('finds a completed code just before the caret', () => {
        expect(findClosedShortcode('nice :fire:', 11)).toEqual({ start: 5, query: 'fire' });
        expect(findClosedShortcode(':+1:', 4)).toEqual({ start: 0, query: '+1' });
    });

    test('ignores times and unfinished codes', () => {
        expect(findClosedShortcode('at 12:30:', 9)).toBeNull();
        expect(findClosedShortcode(':fire', 5)).toBeNull();
    });
});

describe('searchShortcodes', () => {
    test('ranks prefix matches above substring matches', () => {
        const result = searchShortcodes(entries, 'in');
        // Nothing starts with "in"; grinning and thinking contain it, in dataset order.
        expect(result.map((m) => m.entry.emoji)).toEqual(['😀', '🤔']);

        const prefixed = searchShortcodes([...entries, { emoji: 'ℹ️', label: 'Info', shortcodes: ['info'] }], 'in');
        expect(prefixed[0].entry.emoji).toBe('ℹ️');
    });

    test('prefers shorter codes within the same tier', () => {
        const engine: ShortcodeEntry = { emoji: '🚒', label: 'Fire engine', shortcodes: ['fire_engine'] };
        expect(searchShortcodes([engine, fire], 'fi').map((m) => m.entry.emoji)).toEqual(['🔥', '🚒']);
    });

    test('reports the shortcode that matched', () => {
        expect(searchShortcodes(entries, 'thumbs')[0]).toEqual({ entry: thumbsUp, shortcode: 'thumbsup' });
    });

    test('puts recently used emoji first, including skin-toned variants', () => {
        const result = searchShortcodes(entries, 'th', ['🤔']);
        expect(result.map((m) => m.entry.emoji)).toEqual(['🤔', '👍']);

        const toned = searchShortcodes(entries, 'th', ['👍🏽', '🤔']);
        expect(toned.map((m) => m.entry.emoji)).toEqual(['👍', '🤔']);
    });

    test('caps the number of suggestions', () => {
        expect(searchShortcodes(entries, 'i', [], 2)).toHaveLength(2);
    });

    test('returns nothing when no shortcode matches', () => {
        expect(searchShortcodes(entries, 'zzz')).toEqual([]);
    });
});

describe('findExactShortcode', () => {
    test('matches any alias exactly', () => {
        expect(findExactShortcode(entries, '+1')).toBe(thumbsUp);
        expect(findExactShortcode(entries, 'grinning_face')).toBe(grinning);
        expect(findExactShortcode(entries, 'fir')).toBeUndefined();
    });
});

describe('emojiWithSkinTone', () => {
    test('uses the tone chosen for that emoji', () => {
        expect(emojiWithSkinTone(thumbsUp, { '👍': '👍🏽' })).toBe('👍🏽');
        expect(emojiWithSkinTone(thumbsUp, { '👍': '👍' })).toBe('👍');
        expect(emojiWithSkinTone(thumbsUp, {})).toBe('👍');
        expect(emojiWithSkinTone(fire, { '👍': '👍🏽' })).toBe('🔥');
    });
});

describe('replaceRange', () => {
    test('replaces the typed code and places the caret after the emoji', () => {
        expect(replaceRange('hey :fi there', 4, 7, '🔥')).toEqual({ text: 'hey 🔥 there', caret: 6 });
    });
});
