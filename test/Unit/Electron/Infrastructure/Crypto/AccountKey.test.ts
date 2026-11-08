import { describe, expect, test } from 'vitest';
import nacl from 'tweetnacl';
import {
    deriveAccountKey,
    generateRecoveryPhrase,
    isValidRecoveryPhrase,
    signAccountRotation,
    signDeviceApproval,
    signRecoveryChallenge,
    signSignupChallenge,
} from '#electron/Infrastructure/Crypto/AccountKey';

const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' ');

describe('account key', () => {
    test('generates a valid 12-word phrase', () => {
        const words = generateRecoveryPhrase();

        expect(words).toHaveLength(12);
        expect(isValidRecoveryPhrase(words)).toBe(true);
        expect(generateRecoveryPhrase()).not.toEqual(words);
    });

    test('rejects a phrase with a bad checksum', () => {
        expect(isValidRecoveryPhrase([...phrase.slice(0, 11), 'abandon'])).toBe(false);
    });

    test('derives the same key from the same phrase', () => {
        const first = deriveAccountKey(phrase);
        const second = deriveAccountKey(phrase);

        expect(Buffer.from(first.publicKey).toString('base64')).toBe(Buffer.from(second.publicKey).toString('base64'));
        expect(Buffer.from(first.publicKey).toString('hex')).toBe(PINNED_PUBLIC_KEY);
    });

    test('derives different keys from different phrases', () => {
        const other = deriveAccountKey(generateRecoveryPhrase());

        expect(Buffer.from(other.publicKey).toString('hex')).not.toBe(PINNED_PUBLIC_KEY);
    });

    test('signs the signup challenge with the server layout', () => {
        const key = deriveAccountKey(phrase);
        const challenge = Uint8Array.from({ length: 32 }, (_, i) => i);
        const message = Buffer.concat([Buffer.from('cendrite-signup-v1', 'ascii'), challenge]);

        const signature = Buffer.from(signSignupChallenge(key, challenge), 'base64');

        expect(signature).toHaveLength(64);
        expect(nacl.sign.detached.verify(message, signature, key.publicKey)).toBe(true);
    });

    test('signs the recovery challenge with its own label, not the signup one', () => {
        const key = deriveAccountKey(phrase);
        const challenge = Uint8Array.from({ length: 32 }, (_, i) => i);

        const signature = Buffer.from(signRecoveryChallenge(key, challenge), 'base64');

        const recovery = Buffer.concat([Buffer.from('cendrite-recovery-v1', 'ascii'), challenge]);
        const signup = Buffer.concat([Buffer.from('cendrite-signup-v1', 'ascii'), challenge]);
        expect(nacl.sign.detached.verify(recovery, signature, key.publicKey)).toBe(true);
        expect(nacl.sign.detached.verify(signup, signature, key.publicKey)).toBe(false);
    });

    test('signs the device approval with the server layout', () => {
        const key = deriveAccountKey(phrase);
        const device = nacl.sign.keyPair();
        const signalIdentityKey = new Uint8Array([5, ...nacl.randomBytes(32)]);
        const message = Buffer.concat([Buffer.from('device-approval-v1', 'ascii'), key.publicKey, device.publicKey, signalIdentityKey]);

        const signature = Buffer.from(signDeviceApproval(key, device.publicKey, signalIdentityKey), 'base64');

        expect(nacl.sign.detached.verify(message, signature, key.publicKey)).toBe(true);
    });

    test('signs the account rotation with the new key over old then new', () => {
        const oldKey = deriveAccountKey(phrase);
        const newKey = deriveAccountKey(generateRecoveryPhrase());
        const message = Buffer.concat([Buffer.from('account-rotate-v1', 'ascii'), oldKey.publicKey, newKey.publicKey]);

        const signature = Buffer.from(signAccountRotation(newKey, oldKey.publicKey), 'base64');

        expect(nacl.sign.detached.verify(message, signature, newKey.publicKey)).toBe(true);
    });
});

const PINNED_PUBLIC_KEY = 'c130111f32157063ed8a361f671af350c49c2fd37e166005642238eab8890be6';
