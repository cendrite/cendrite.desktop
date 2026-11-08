import { describe, expect, test } from 'vitest';
import { formatUserTag, normalizeUserTag } from '@/React/Common/Utilities.ts';

describe('user tag', () => {
    test('groups the 12 digits in fours for display', () => {
        expect(formatUserTag('482177301593')).toBe('4821 7730 1593');
    });

    test('accepts a full tag with or without spaces', () => {
        expect(normalizeUserTag('4821 7730 1593')).toBe('482177301593');
        expect(normalizeUserTag('482177301593')).toBe('482177301593');
    });

    test('ignores input until it is a full 12-digit tag', () => {
        expect(normalizeUserTag('4821 7730')).toBeNull();
        expect(normalizeUserTag('4821773015930')).toBeNull();
        expect(normalizeUserTag('alice#482177K')).toBeNull();
        expect(normalizeUserTag('')).toBeNull();
    });
});
