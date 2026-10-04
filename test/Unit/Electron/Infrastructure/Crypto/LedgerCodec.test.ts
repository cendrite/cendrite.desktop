import { describe, expect, test } from 'vitest';
import {
    buildSigningInput,
    bytesToUuid,
    decryptPayload,
    encryptPayload,
    generateEpochKey,
    generateWriteKeyPair,
    hashEvent,
    publicKeyFromPrivate,
    readEpoch,
    signOuter,
    uuidToBytes,
    verifyOuter,
} from '../../../../../src/Electron/Infrastructure/Crypto/LedgerCodec.js';

/**
 * The expected values below were produced by the Ledger service's own SignatureHelper, not by this code.
 * They are the contract with the server: if the layout drifts by a byte, these fail.
 */
const GOLDEN = {
    groupId: '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10',
    version: 2,
    previousHash: fill(0x11, 32),
    payload: Buffer.from([0x01, 0x02, 0x03]),
    keysAdded: [fill(0xaa, 32), fill(0x22, 32)],
    keysRemoved: [fill(0x33, 32)],
    seed: fill(0x42, 32),
    signingInputLength: 168,
    signingInputHex:
        '6c65646765722d76310199673a3c1e7c2b9f2e5d8b1a4c7e1000000002' +
        '1111111111111111111111111111111111111111111111111111111111111111' +
        '00000002' +
        '2222222222222222222222222222222222222222222222222222222222222222' +
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
        '00000001' +
        '3333333333333333333333333333333333333333333333333333333333333333' +
        '010203',
    hashHex: 'd7f12dae588efc4429d4ce8b95f64da6cf9efa6791d7ce1be6c7d129c5119d7b',
    publicKeyHex: '2152f8d19b791d24453242e15f2eab6cb7cffa7b6a5ed30097960e069881db12',
    signatureHex:
        'a0e9075a9436dd6b43deffb7c49364d6fcc3bfe42321b0da2e86e749b4fbb874' +
        '6026004c9bd6962ce70d873326f93e1986834d845cb427f14654afb8f7e8bc08',
};

function fill(value: number, length: number): Buffer {
    return Buffer.alloc(length, value);
}

function goldenInput(): Buffer {
    return buildSigningInput({
        groupId: GOLDEN.groupId,
        version: GOLDEN.version,
        previousHash: GOLDEN.previousHash,
        payload: GOLDEN.payload,
        keysAdded: GOLDEN.keysAdded,
        keysRemoved: GOLDEN.keysRemoved,
    });
}

describe('signing input', () => {
    test('matches the vector produced by the Ledger service', () => {
        const input = goldenInput();

        expect(input.length).toBe(GOLDEN.signingInputLength);
        expect(input.toString('hex')).toBe(GOLDEN.signingInputHex);
    });

    test('hashes to the value the server stores as the head', () => {
        expect(hashEvent(goldenInput()).toString('hex')).toBe(GOLDEN.hashHex);
    });

    test('sorts write keys, so the order the client lists them in does not matter', () => {
        const reversed = buildSigningInput({
            groupId: GOLDEN.groupId,
            version: GOLDEN.version,
            previousHash: GOLDEN.previousHash,
            payload: GOLDEN.payload,
            keysAdded: [...GOLDEN.keysAdded].reverse(),
            keysRemoved: GOLDEN.keysRemoved,
        });

        expect(reversed.toString('hex')).toBe(GOLDEN.signingInputHex);
    });

    test('sorts by raw bytes, not by signed comparison', () => {
        const low = fill(0x01, 32);
        const high = fill(0xff, 32);

        const input = buildSigningInput({
            groupId: GOLDEN.groupId,
            version: 1,
            previousHash: Buffer.alloc(32),
            payload: Buffer.from([0x00]),
            keysAdded: [high, low],
        });

        const keys = input.subarray(9 + 16 + 4 + 32 + 4, 9 + 16 + 4 + 32 + 4 + 64);
        expect(keys.subarray(0, 32).toString('hex')).toBe(low.toString('hex'));
    });

    test('distinguishes added from removed', () => {
        const key = fill(0x01, 32);
        const base = { groupId: GOLDEN.groupId, version: 1, previousHash: Buffer.alloc(32), payload: Buffer.from([1]) };

        const added = buildSigningInput({ ...base, keysAdded: [key] });
        const removed = buildSigningInput({ ...base, keysRemoved: [key] });

        expect(added.toString('hex')).not.toBe(removed.toString('hex'));
    });

    test('writes zero counts when there are no key changes', () => {
        const input = buildSigningInput({
            groupId: GOLDEN.groupId,
            version: 1,
            previousHash: Buffer.alloc(32),
            payload: Buffer.from([0x09]),
        });

        expect(input.length).toBe(9 + 16 + 4 + 32 + 4 + 4 + 1);
        expect(input.readInt32BE(9 + 16 + 4 + 32)).toBe(0);
    });

    test('rejects a previous hash of the wrong size', () => {
        expect(() =>
            buildSigningInput({
                groupId: GOLDEN.groupId,
                version: 1,
                previousHash: Buffer.alloc(31),
                payload: Buffer.from([1]),
            }),
        ).toThrow();
    });
});

describe('uuid encoding', () => {
    test('round trips in standard byte order', () => {
        expect(bytesToUuid(uuidToBytes(GOLDEN.groupId))).toBe(GOLDEN.groupId);
    });

    test('writes the uuid big-endian, as the server reads it', () => {
        expect(uuidToBytes(GOLDEN.groupId).toString('hex')).toBe('0199673a3c1e7c2b9f2e5d8b1a4c7e10');
    });
});

describe('signatures', () => {
    test('produces the same signature the server verifies', () => {
        const signature = signOuter(GOLDEN.seed, goldenInput());

        expect(signature.toString('hex')).toBe(GOLDEN.signatureHex);
        expect(signature.length).toBe(64);
    });

    test('derives the public key the server checks against', () => {
        expect(publicKeyFromPrivate(GOLDEN.seed).toString('hex')).toBe(GOLDEN.publicKeyHex);
    });

    test('verifies a signature it produced', () => {
        const { publicKey, privateKey } = generateWriteKeyPair();
        const input = goldenInput();

        expect(verifyOuter(publicKey, input, signOuter(privateKey, input))).toBe(true);
    });

    test('generates raw 32 byte keys, not DER', () => {
        const { publicKey, privateKey } = generateWriteKeyPair();

        expect(publicKey.length).toBe(32);
        expect(privateKey.length).toBe(32);
    });

    test('rejects a signature over different bytes', () => {
        const { publicKey, privateKey } = generateWriteKeyPair();
        const signature = signOuter(privateKey, goldenInput());

        const tampered = buildSigningInput({
            groupId: GOLDEN.groupId,
            version: GOLDEN.version,
            previousHash: GOLDEN.previousHash,
            payload: Buffer.from([0x09, 0x09, 0x09]),
            keysAdded: GOLDEN.keysAdded,
            keysRemoved: GOLDEN.keysRemoved,
        });

        expect(verifyOuter(publicKey, tampered, signature)).toBe(false);
    });

    test('rejects a malformed public key instead of throwing', () => {
        const { privateKey } = generateWriteKeyPair();
        const input = goldenInput();

        expect(verifyOuter(Buffer.alloc(31), input, signOuter(privateKey, input))).toBe(false);
    });
});

describe('payload encryption', () => {
    test('round trips and exposes the epoch in the clear', () => {
        const key = generateEpochKey();
        const plaintext = Buffer.from('{"type":1}', 'utf8');

        const payload = encryptPayload(key, 3, GOLDEN.groupId, 7, plaintext);

        expect(readEpoch(payload)).toBe(3);
        expect(decryptPayload(key, GOLDEN.groupId, 7, payload)).toEqual(plaintext);
    });

    test('is laid out as epoch, iv, ciphertext and tag', () => {
        const payload = encryptPayload(generateEpochKey(), 1, GOLDEN.groupId, 1, Buffer.from([0x01]));

        expect(payload.length).toBe(4 + 12 + 1 + 16);
    });

    test('fails when decrypted at another version', () => {
        const key = generateEpochKey();
        const payload = encryptPayload(key, 1, GOLDEN.groupId, 7, Buffer.from('op', 'utf8'));

        expect(() => decryptPayload(key, GOLDEN.groupId, 8, payload)).toThrow();
    });

    test('fails when decrypted for another group', () => {
        const key = generateEpochKey();
        const payload = encryptPayload(key, 1, GOLDEN.groupId, 7, Buffer.from('op', 'utf8'));

        expect(() => decryptPayload(key, '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e11', 7, payload)).toThrow();
    });

    test('fails with the wrong epoch key', () => {
        const payload = encryptPayload(generateEpochKey(), 1, GOLDEN.groupId, 7, Buffer.from('op', 'utf8'));

        expect(() => decryptPayload(generateEpochKey(), GOLDEN.groupId, 7, payload)).toThrow();
    });

    test('fails when the ciphertext is tampered with', () => {
        const key = generateEpochKey();
        const payload = encryptPayload(key, 1, GOLDEN.groupId, 7, Buffer.from('op', 'utf8'));
        payload[payload.length - 1] ^= 0xff;

        expect(() => decryptPayload(key, GOLDEN.groupId, 7, payload)).toThrow();
    });
});
