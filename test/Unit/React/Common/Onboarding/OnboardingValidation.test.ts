import { describe, expect, test } from 'vitest';
import { containsReservedName, validateUsername } from '@/React/Common/Components/Onboarding/OnboardingValidation.ts';

describe('username', () => {
    test.each(['Cendrite', 'admin', 'TheAdmin', 'CENDRITEsupport', 'c3ndr1te', '4dm1n', 'adm1n'])('refuses the reserved name %s', (name) => {
        expect(containsReservedName(name)).toBe(true);
        expect(validateUsername(name)).toBe('That name is reserved. Choose another one.');
    });

    test.each(['ad min', 'c.endrite', 'аdmin', 'ad​min', 'cendrité', 'bob_1'])('refuses %s for using more than letters and digits', (name) => {
        expect(validateUsername(name)).toBe('Use only letters and digits.');
    });

    test.each(['Kristian', 'Adam', 'Cendra', 'Bo', 'bob1'])('accepts %s', (name) => {
        expect(validateUsername(name)).toBeNull();
    });

    test('needs two to twenty characters', () => {
        expect(validateUsername('a')).toBe('Use at least 2 characters.');
        expect(validateUsername('a'.repeat(21))).toBe('Use at most 20 characters.');
    });
});
