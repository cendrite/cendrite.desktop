import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { initializeDatabase } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { PrivateTokenRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/PrivateTokenRepository.js';

let sut: PrivateTokenRepository;

beforeAll(async () => {
    await initializeDatabase(':memory:');
    sut = new PrivateTokenRepository();
});

beforeEach(async () => {
    await sut.deleteAll();
});

function token(fill: number): Buffer {
    return Buffer.alloc(354, fill);
}

describe('store and count', () => {
    test('counts the tokens stored for an origin', async () => {
        await sut.store('ledger', [token(1), token(2), token(3)]);

        expect(await sut.count('ledger')).toBe(3);
    });

    test('keeps origins apart', async () => {
        await sut.store('ledger', [token(1)]);
        await sut.store('keystore', [token(2), token(3)]);

        expect(await sut.count('ledger')).toBe(1);
        expect(await sut.count('keystore')).toBe(2);
        expect(await sut.take('ledger')).toEqual(token(1));
        expect(await sut.take('ledger')).toBeNull();
    });
});

describe('take', () => {
    test('returns a stored token and removes it', async () => {
        await sut.store('ledger', [token(7)]);

        expect(await sut.take('ledger')).toEqual(token(7));
        expect(await sut.count('ledger')).toBe(0);
    });

    test('returns null when the wallet is empty', async () => {
        expect(await sut.take('ledger')).toBeNull();
    });

    test('never hands out the same token twice when taken in parallel', async () => {
        await sut.store('ledger', [token(1), token(2), token(3)]);

        const taken = await Promise.all([sut.take('ledger'), sut.take('ledger'), sut.take('ledger'), sut.take('ledger')]);

        const handedOut = taken.filter((value): value is Buffer => value !== null);
        expect(handedOut).toHaveLength(3);
        expect(new Set(handedOut.map((value) => value.toString('hex'))).size).toBe(3);
        expect(taken.filter((value) => value === null)).toHaveLength(1);
        expect(await sut.count('ledger')).toBe(0);
    });
});

describe('deleteAll', () => {
    test('removes tokens for every origin', async () => {
        await sut.store('ledger', [token(1)]);
        await sut.store('keystore', [token(2)]);

        await sut.deleteAll();

        expect(await sut.count('ledger')).toBe(0);
        expect(await sut.count('keystore')).toBe(0);
    });
});
