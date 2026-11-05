import { describe, expect, test } from 'vitest';
import { MAX_SUGGESTIONS, suggestWords } from '@/React/Features/Recover/Components/SuggestWords.ts';

describe('recovery word suggestions', () => {
    test('suggests nothing for an empty box, so the list never shows everything', () => {
        expect(suggestWords('')).toEqual([]);
        expect(suggestWords('   ')).toEqual([]);
    });

    test('suggests words that start with what was typed, capped', () => {
        const suggestions = suggestWords('ab');

        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
        expect(suggestions.every((word) => word.startsWith('ab'))).toBe(true);
    });

    test('ignores case and surrounding spaces', () => {
        expect(suggestWords('  CHUC ')).toEqual(['chuckle']);
    });

    test('closes once the word is complete and unambiguous', () => {
        expect(suggestWords('chuckle')).toEqual([]);
    });

    test('keeps suggesting while a complete word is also a prefix of others', () => {
        expect(suggestWords('act')).toEqual(expect.arrayContaining(['act', 'action', 'actor']));
    });

    test('suggests nothing for letters no word starts with', () => {
        expect(suggestWords('xq')).toEqual([]);
    });
});
