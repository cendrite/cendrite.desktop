import { DeviceType } from '@privacyresearch/libsignal-protocol-typescript';
import { PreKeyBundle } from '../../Common/Api/KeyStore/GetPreKeyBundleApi';

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
