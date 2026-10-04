import {
    createCipheriv,
    createDecipheriv,
    createHash,
    createPrivateKey,
    createPublicKey,
    generateKeyPairSync,
    randomBytes,
    sign as edSign,
    verify as edVerify,
} from 'crypto';
import { EPOCH_HEADER_BYTES, HASH_BYTES, IV_BYTES, SIGNATURE_BYTES, WRITE_KEY_BYTES } from '../../Domain/Ledger/LedgerEvent.js';

const DOMAIN_PREFIX = Buffer.from('ledger-v1', 'ascii');
const OPERATION_PREFIX = Buffer.from('ledger-op-v1', 'ascii');
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const GCM_TAG_BYTES = 16;
const EPOCH_KEY_BYTES = 32;

export interface WriteKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
}

export interface SigningInputParts {
    groupId: string;
    version: number;
    previousHash: Buffer;
    payload: Buffer;
    keysAdded?: Buffer[];
    keysRemoved?: Buffer[];
}

export function uuidToBytes(uuid: string): Buffer {
    const hex = uuid.replace(/-/g, '');
    if (hex.length !== 32) throw new Error(`Malformed uuid: ${uuid}`);
    return Buffer.from(hex, 'hex');
}

export function bytesToUuid(bytes: Buffer): string {
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * The server rebuilds these exact bytes to verify a signature, so the layout is protocol:
 * "ledger-v1" || groupId(16) || version(4 BE) || previousHash(32) || added count(4 BE) || sorted added
 * || removed count(4 BE) || sorted removed || payload
 */
export function buildSigningInput(parts: SigningInputParts): Buffer {
    const { groupId, version, previousHash, payload } = parts;
    const keysAdded = parts.keysAdded ?? [];
    const keysRemoved = parts.keysRemoved ?? [];

    assertLength('previousHash', previousHash, HASH_BYTES);
    [...keysAdded, ...keysRemoved].forEach((key) => assertLength('write key', key, WRITE_KEY_BYTES));

    return Buffer.concat([
        DOMAIN_PREFIX,
        uuidToBytes(groupId),
        bigEndian(version),
        previousHash,
        writeKeyList(keysAdded),
        writeKeyList(keysRemoved),
        payload,
    ]);
}

/**
 * What the author signs with their libsignal identity key, inside the ciphertext. Binding the group and
 * version stops an operation being replayed into another group or at another position.
 */
export function buildOperationSigningInput(groupId: string, version: number, operation: Buffer): Buffer {
    return Buffer.concat([OPERATION_PREFIX, uuidToBytes(groupId), bigEndian(version), operation]);
}

export function hashEvent(signingInput: Buffer): Buffer {
    return createHash('sha256').update(signingInput).digest();
}

export function generateWriteKeyPair(): WriteKeyPair {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');

    return {
        publicKey: jwkField(publicKey.export({ format: 'jwk' }).x),
        privateKey: jwkField(privateKey.export({ format: 'jwk' }).d),
    };
}

export function signOuter(privateKey: Buffer, signingInput: Buffer): Buffer {
    assertLength('private key', privateKey, WRITE_KEY_BYTES);

    const key = createPrivateKey({
        key: Buffer.concat([PKCS8_ED25519_PREFIX, privateKey]),
        format: 'der',
        type: 'pkcs8',
    });

    return edSign(null, signingInput, key);
}

export function verifyOuter(publicKey: Buffer, signingInput: Buffer, signature: Buffer): boolean {
    if (publicKey.length !== WRITE_KEY_BYTES || signature.length !== SIGNATURE_BYTES) return false;

    try {
        const key = createPublicKey({
            key: { kty: 'OKP', crv: 'Ed25519', x: publicKey.toString('base64url') },
            format: 'jwk',
        });

        return edVerify(null, signingInput, key, signature);
    } catch {
        return false;
    }
}

export function publicKeyFromPrivate(privateKey: Buffer): Buffer {
    const key = createPrivateKey({
        key: Buffer.concat([PKCS8_ED25519_PREFIX, privateKey]),
        format: 'der',
        type: 'pkcs8',
    });

    return jwkField(createPublicKey(key).export({ format: 'jwk' }).x);
}

export function generateEpochKey(): Buffer {
    return randomBytes(EPOCH_KEY_BYTES);
}

export function readEpoch(payload: Buffer): number {
    if (payload.length < EPOCH_HEADER_BYTES + IV_BYTES + GCM_TAG_BYTES) throw new Error('Malformed ledger payload');
    return payload.readInt32BE(0);
}

/**
 * The epoch, group and version are bound as additional data, so a ciphertext cannot be replayed at
 * another position in the log. The server never decrypts, so this stays a client-side choice.
 */
export function encryptPayload(epochKey: Buffer, epoch: number, groupId: string, version: number, plaintext: Buffer): Buffer {
    assertLength('epoch key', epochKey, EPOCH_KEY_BYTES);

    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', epochKey, iv);
    cipher.setAAD(additionalData(groupId, version, epoch));

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    return Buffer.concat([bigEndian(epoch), iv, ciphertext, cipher.getAuthTag()]);
}

export function decryptPayload(epochKey: Buffer, groupId: string, version: number, payload: Buffer): Buffer {
    assertLength('epoch key', epochKey, EPOCH_KEY_BYTES);

    const epoch = readEpoch(payload);
    const iv = payload.subarray(EPOCH_HEADER_BYTES, EPOCH_HEADER_BYTES + IV_BYTES);
    const tag = payload.subarray(payload.length - GCM_TAG_BYTES);
    const ciphertext = payload.subarray(EPOCH_HEADER_BYTES + IV_BYTES, payload.length - GCM_TAG_BYTES);

    const decipher = createDecipheriv('aes-256-gcm', epochKey, iv);
    decipher.setAAD(additionalData(groupId, version, epoch));
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function additionalData(groupId: string, version: number, epoch: number): Buffer {
    return Buffer.concat([uuidToBytes(groupId), bigEndian(version), bigEndian(epoch)]);
}

function writeKeyList(keys: Buffer[]): Buffer {
    const sorted = [...keys].sort(Buffer.compare);
    return Buffer.concat([bigEndian(sorted.length), ...sorted]);
}

function bigEndian(value: number): Buffer {
    const bytes = Buffer.alloc(4);
    bytes.writeInt32BE(value);
    return bytes;
}

function jwkField(value: string | undefined): Buffer {
    if (!value) throw new Error('Ed25519 key export is missing its raw component');
    return Buffer.from(value, 'base64url');
}

function assertLength(name: string, value: Buffer, expected: number): void {
    if (value.length !== expected) throw new Error(`Expected ${name} to be ${expected} bytes, got ${value.length}`);
}
