import { describe, expect, test } from 'vitest';
import { isProofOfWorkSolved, leadingZeroBits, solveProofOfWork } from '#electron/Infrastructure/Crypto/ProofOfWork';

const challenge = Uint8Array.from({ length: 32 }, (_, i) => i);

describe('proof of work', () => {
    test.each([
        [8, 537n],
        [12, 1755n],
        [16, 13402n],
    ])('finds the same first solution as the server for difficulty %i', async (difficulty, expected) => {
        expect(await solveProofOfWork(challenge, difficulty)).toBe(expected);
    });

    test('agrees with the server vector at the default difficulty', () => {
        expect(isProofOfWorkSolved(challenge, 1111622n, 20)).toBe(true);
        expect(isProofOfWorkSolved(challenge, 1111621n, 20)).toBe(false);
    });

    test('counts leading zero bits across byte boundaries', () => {
        expect(leadingZeroBits(Uint8Array.from([0xff]))).toBe(0);
        expect(leadingZeroBits(Uint8Array.from([0x38]))).toBe(2);
        expect(leadingZeroBits(Uint8Array.from([0x00, 0x00, 0x0f]))).toBe(20);
        expect(leadingZeroBits(Uint8Array.from([0x00, 0x00, 0x05]))).toBe(21);
        expect(leadingZeroBits(new Uint8Array(4))).toBe(32);
    });
});
