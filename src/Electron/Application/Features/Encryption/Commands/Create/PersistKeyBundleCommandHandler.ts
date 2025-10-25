import { ErrorMessage } from '../../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../../Shared/Result/Result.js';
import { EcPreKey } from '../../../../../Domain/Encryption/EcPreKey.js';
import { IdentityKeys } from '../../../../../Domain/Encryption/IdentityKeys.js';
import { SignedPreKey } from '../../../../../Domain/Encryption/SignedPreKey.js';
import { KeyCacher } from '../../../../../Persistence/Cache/KeyCacher.js';
import { ProtocolStore } from '../../../../../Persistence/Repositories/ProtocolStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { PersistKeyBundleCommand } from './PersistKeyBundleCommand.js';

export class PersistsKeyBundleCommandHandler implements Handler<PersistKeyBundleCommand, void> {
    public async handle(request: PersistKeyBundleCommand): Promise<Result<void>> {
        try {
            const keys = KeyCacher.getInstance().retrieveSecrets(request.cacheToken);
            if (!keys) {
                return Result.fail(new ErrorMessage(null, 'No keys found for the provided cache token'));
            }

            const protocolStore = new ProtocolStore();

            console.log('Persisting Key Bundle for Registration ID:', keys.registrationId);
            console.log("amount of ecPreKeys:", keys.ecPreKeys.length);

            await protocolStore.createKeyBundle(
                new IdentityKeys(
                    1,
                    keys.registrationId,
                    Buffer.from(keys.identityPriv.serialize()),
                    Buffer.from(keys.identityPub.serialize()),
                ),
                new SignedPreKey(
                    keys.signedPreKey.id(),
                    Buffer.from(keys.signedPreKey.publicKey().serialize()),
                    Buffer.from(keys.signedPreKey.privateKey().serialize()),
                    Buffer.from(keys.signedPreKey.signature()),
                    new Date(keys.signedPreKey.timestamp()),
                ),
                keys.ecPreKeys.map((preke)=> new EcPreKey(
                   Buffer.from(preke.privateKey().serialize()), 
                   Buffer.from(preke.publicKey().serialize()),
                ),
            ));

            return Result.success();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Persist Key Bundle Failed:', errorMessage);
            return Result.fail<void>(new ErrorMessage(null, 'Persist Key Bundle Failed'));
        }
    }
}
