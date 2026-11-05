import { describe, expect, test } from 'vitest';
import { cipherOf, scrambleFrame } from '@/React/Common/Components/Loading/Scramble.ts';

describe('cipherOf', () => {
    test('keeps the length and looks like base64', () => {
        const cipher = cipherOf('See you at eight.');
        expect(cipher).toHaveLength('See you at eight.'.length);
        expect(cipher).toMatch(/^[A-Za-z0-9+/]+$/);
    });

    test('is different every time', () => {
        expect(cipherOf('See you at eight.')).not.toBe(cipherOf('See you at eight.'));
    });
});

describe('scrambleFrame', () => {
    const random = () => 0;

    test('starts at the source and ends at the target', () => {
        expect(scrambleFrame('abcdef', 'uvwxyz', 0, random, 0)).toBe('abcdef');
        expect(scrambleFrame('abcdef', 'uvwxyz', 1, random)).toBe('uvwxyz');
    });

    test('settles characters left to right with a scrambled band at the wave', () => {
        expect(scrambleFrame('abcdef', 'uvwxyz', 0.5, random, 2)).toBe('uvwAAf');
    });

    test('handles texts of different lengths', () => {
        expect(scrambleFrame('ab', 'uvwx', 0.5, random, 0)).toBe('uv  ');
        expect(scrambleFrame('abcd', 'uv', 1, random)).toBe('uv');
    });
});
