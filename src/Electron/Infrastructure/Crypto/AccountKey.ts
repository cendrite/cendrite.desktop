import { hkdfSync } from 'node:crypto';
import nacl from 'tweetnacl';
import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

const ACCOUNT_KEY_INFO = 'cendrite-account-v1';
const SIGNUP_CONTEXT = Buffer.from('cendrite-signup-v1', 'ascii');
const RECOVERY_CONTEXT = Buffer.from('cendrite-recovery-v1', 'ascii');
const DEVICE_APPROVAL_CONTEXT = Buffer.from('device-approval-v1', 'ascii');

export interface AccountKeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}

export function generateRecoveryPhrase(): string[] {
    return generateMnemonic(wordlist, 128).split(' ');
}

export function isValidRecoveryPhrase(words: string[]): boolean {
    return validateMnemonic(words.join(' '), wordlist);
}

export function deriveAccountKey(words: string[]): AccountKeyPair {
    const entropy = mnemonicToEntropy(words.join(' '), wordlist);
    const seed = new Uint8Array(hkdfSync('sha256', entropy, new Uint8Array(0), ACCOUNT_KEY_INFO, 32));
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    seed.fill(0);
    entropy.fill(0);
    return keyPair;
}

export function signSignupChallenge(accountKey: AccountKeyPair, challenge: Uint8Array): string {
    return sign(accountKey, Buffer.concat([SIGNUP_CONTEXT, challenge]));
}

export function signRecoveryChallenge(accountKey: AccountKeyPair, challenge: Uint8Array): string {
    return sign(accountKey, Buffer.concat([RECOVERY_CONTEXT, challenge]));
}

export function signDeviceApproval(accountKey: AccountKeyPair, devicePublicKey: Uint8Array): string {
    return sign(accountKey, Buffer.concat([DEVICE_APPROVAL_CONTEXT, accountKey.publicKey, devicePublicKey]));
}

function sign(accountKey: AccountKeyPair, message: Uint8Array): string {
    return Buffer.from(nacl.sign.detached(message, accountKey.secretKey)).toString('base64');
}
