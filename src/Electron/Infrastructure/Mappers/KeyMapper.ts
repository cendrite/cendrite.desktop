import { DeviceType, KeyPairType } from '@privacyresearch/libsignal-protocol-typescript';
import { KeyPair, PreKeyBundle } from '../Models/KeyModels.js';

export function mapBundleToDevice(keyBundle: PreKeyBundle): DeviceType<ArrayBuffer> {
    return {
        registrationId: keyBundle.registrationId,
        identityKey: Uint8Array.from(atob(keyBundle.identityKey), (c) => c.charCodeAt(0)).buffer,
        signedPreKey: {
            keyId: keyBundle.signedPrekeyId,
            publicKey: Uint8Array.from(atob(keyBundle.signedPreKeyPublic), (c) => c.charCodeAt(0)).buffer,
            signature: Uint8Array.from(atob(keyBundle.signedPreKeySignature), (c) => c.charCodeAt(0)).buffer,
        },
        preKey: keyBundle.preKey
            ? {
                keyId: keyBundle.preKey.keyId,
                publicKey: Uint8Array.from(atob(keyBundle.preKey.publicKey), (c) => c.charCodeAt(0)).buffer,
            }
            : undefined,
    };
}

export function mapFromSignalKeyPair(keyPair: KeyPairType<ArrayBuffer>): KeyPair {
    return new KeyPair(Buffer.from(new Uint8Array(keyPair.pubKey)), Buffer.from(new Uint8Array(keyPair.privKey)));
}

export function mapToSignalKeyPair(keyPair: KeyPair): KeyPairType<ArrayBuffer> {
    const pub = toArrayBuffer(keyPair.publicKey as any);
    const priv = toArrayBuffer(keyPair.privateKey as any);

    return {
        pubKey: pub,
        privKey: priv,
    };
}

function toArrayBuffer(src: Buffer | Uint8Array | ArrayBuffer | { type: string; data: number[] }): ArrayBuffer {
    if (src instanceof ArrayBuffer) {
        return src;
    }

    if (src instanceof Uint8Array) {
        return src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength);
    }

    const anySrc: any = src;
    if (anySrc && anySrc.type === 'Buffer' && Array.isArray(anySrc.data)) {
        const u8 = Uint8Array.from(anySrc.data);
        return u8.buffer;
    }

    throw new Error('Unsupported key buffer format in mapToSignalKeyPair');
}
