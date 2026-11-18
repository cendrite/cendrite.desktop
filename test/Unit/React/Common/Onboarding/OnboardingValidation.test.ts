import { describe, expect, test } from 'vitest';
import { containsReservedName, validateUsername } from '@/React/Common/Components/Onboarding/OnboardingValidation.ts';

describe('reserved names', () => {
    test.each([
        'Cendrite',
        'admin',
        'TheAdmin',
        'CENDRITE support',
        'c3ndr1te',
        '4dm1n',
        '@dmin',
        'c.e.n.d.r.i.t.e',
        'аdmin',
        'ad​min',
        'cendrité',
    ])('refuses %s', (name) => {
        expect(containsReservedName(name)).toBe(true);
        expect(validateUsername(name)).toBe('That name is reserved. Choose another one.');
    });

    test.each(['Kristian', 'Adam', 'Cendra', 'abc'])('accepts %s', (name) => {
        expect(containsReservedName(name)).toBe(false);
        expect(validateUsername(name)).toBeNull();
    });

    test('still reports length problems first', () => {
        expect(validateUsername('ad')).toBe('Use at least 3 characters.');
    });
});
