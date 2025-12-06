import { ErrorMessage } from '../../../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../../../Shared/Result/Result.js';
import { EcPreKey } from '../../../../../../Domain/Encryption/EcPreKey.js';
import { IdentityKeys } from '../../../../../../Domain/Encryption/IdentityKeys.js';
import { SignedPreKey } from '../../../../../../Domain/Encryption/SignedPreKey.js';
import { KeyCacher } from '../../../../../../Persistence/Cache/KeyCacher.js';
import { ProtocolStore } from '../../../../../../Persistence/Repositories/ProtocolStore.js';
import { Handler } from '../../../../../Mediator/Handler.js';
import { PersistKeyBundleCommand } from './PersistKeyBundleCommand.js';

export class PersistsKeyBundleCommandHandler implements Handler<PersistKeyBundleCommand, void> {
    public async handle(request: PersistKeyBundleCommand): Promise<Result<void>> {
        const keys = KeyCacher.getInstance().retrieveSecrets(request.cacheToken);
        if (!keys) {
            return Result.fail(new ErrorMessage(null, 'No keys found for the provided cache token'));
        }

        const protocolStore = new ProtocolStore();

        console.log('Persisting Key Bundle for Registration ID:', keys.registrationId);
        console.log('amount of ecPreKeys:', keys.ecPreKeys.length);

        await protocolStore.createKeyBundle(
            new IdentityKeys(
                1,
                keys.registrationId,
                Buffer.from(keys.identityKey.privKey),
                Buffer.from(keys.identityKey.pubKey),
            ),
            new SignedPreKey(
                keys.signedPreKey.keyId,
                Buffer.from(keys.signedPreKey.keyPair.pubKey),
                Buffer.from(keys.signedPreKey.keyPair.privKey),
                Buffer.from(keys.signedPreKey.signature),
                new Date(keys.signedPrekeyTimestamp),
            ),
            keys.ecPreKeys.map(
                (preke) => new EcPreKey(Buffer.from(preke.keyPair.privKey), Buffer.from(preke.keyPair.pubKey)),
            ),
        );

        return Result.success();
    }
}
