import { KEMPublicKey, PreKeyBundle as SignalPreKeyBundle, PublicKey } from '@signalapp/libsignal-client';
import { PreKeyBundle } from '../../Application/Contracts/Providers/IKeyStoreProvider.js';

/**
 * Maps a pre-key bundle fetched from the keystore (base64 fields) to a libsignal PreKeyBundle.
 * @param deviceId libsignal device id of the remote address the bundle belongs to.
 */
export function mapToPreKeyBundle(keyBundle: PreKeyBundle, deviceId: number): SignalPreKeyBundle {
    return SignalPreKeyBundle.new(
        keyBundle.registrationId,
        deviceId,
        keyBundle.preKey ? keyBundle.preKey.keyId : null,
        keyBundle.preKey ? PublicKey.deserialize(fromBase64(keyBundle.preKey.publicKey)) : null,
        keyBundle.signedPrekeyId,
        PublicKey.deserialize(fromBase64(keyBundle.signedPreKeyPublic)),
        fromBase64(keyBundle.signedPreKeySignature),
        PublicKey.deserialize(fromBase64(keyBundle.identityKey)),
        keyBundle.kyberPreKeyId,
        KEMPublicKey.deserialize(fromBase64(keyBundle.kyberPreKeyPublic)),
        fromBase64(keyBundle.kyberPreKeySignature),
    );
}

function fromBase64(value: string) {
    return new Uint8Array(Buffer.from(value, 'base64'));
}
