import { DeviceType, KeyPairType } from '@privacyresearch/libsignal-protocol-typescript';
import { PreKeyBundle } from '../../Common/Api/KeyStore/GetPreKeyBundleApi';
import { KeyPairDto } from '../../../Electron/Application/Features/Encryption/Dtos/KeyPairDto';

export function mapBundleToDevice(keyBundle: PreKeyBundle): DeviceType<ArrayBuffer> {
    return {
        registrationId: keyBundle.registrationId,
        identityKey: Uint8Array.from(atob(keyBundle.identityKey), (c) => c.charCodeAt(0)).buffer,
        signedPreKey: {
            keyId: keyBundle.signedPreKeyId,
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

export function mapToSignalKeyPair(keyPair: KeyPairDto):KeyPairType<ArrayBuffer> {
    return {
        pubKey: Uint8Array.from((keyPair.publicKey)),
        privKey: Uint8Array.from((keyPair.privateKey)) 
    };
}

export function mapFromSignalKeyPair(keyPair: KeyPairType<ArrayBuffer>): KeyPairDto {
    return new KeyPairDto(
        Buffer.from(new Uint8Array(keyPair.pubKey)),
        Buffer.from(new Uint8Array(keyPair.privKey)),
    );
}
