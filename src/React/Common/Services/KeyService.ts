import { Result } from '../../../Shared/Result/Result';
import { CreateKeyBundleApi } from '../Api/KeyStore/CreateKeyBundleApi';
import { GenerateKeyBundleDto } from '../../../Electron/Application/Features/Encryption/Commands/Generate/GenerateKeyBundleDto.ts';
import { GenerateKeyBundleCommand } from '../../../Electron/Application/Features/Encryption/Commands/Generate/GenerateKeyBundleCommand';
import { ErrorMessage } from '../../../Shared/Result/ErrorMessage.ts';
import { PersistKeyBundleCommand } from '../../../Electron/Application/Features/Encryption/Commands/Create/Bundle/PersistKeyBundleCommand.ts';
import { PreKeyBundle } from '../Api/KeyStore/GetPreKeyBundleApi.ts';
import { GetPreKeyBundleApi } from '../Api/KeyStore/GetPreKeyBundleApi.ts';

export class KeyService {
    private readonly createKeyBundleApi = new CreateKeyBundleApi();
    private readonly getPreKeyBundleApi = new GetPreKeyBundleApi();

    public async SaveKeys(connectionId: string): Promise<Result<void>> {
        const generationResult = await window.electron.sendRequestAsync<Result<GenerateKeyBundleDto>>(
            new GenerateKeyBundleCommand(),
        );

        const saveResult = await this.createKeyBundleApi.createKeyBundle({
            accessKey: connectionId,
            identityKey: generationResult.data!.identityKeyPublic,
            registrationId: generationResult.data!.registrationId,
            signedPreKeyPublic: generationResult.data!.signedPreKey.publicKey,
            signedPreKeyId: generationResult.data!.signedPreKey.keyId,
            signedPreKeySignature: generationResult.data!.signedPreKey.signature,
            signedPreKeyTimestamp: generationResult.data!.signedPreKey.timestamp,
            preKeys: generationResult.data!.oneTimePreKeys.map((k) => ({
                keyId: k.keyId,
                publicKey: k.publicKey,
            })),
        });

        if (!saveResult.success) {
            console.error('Error saving keys to keystore: ' + saveResult.errorMessage);
            return Result.fail(new ErrorMessage(null, 'Error saving keys to keystore'));
        }

        const persistResult = await window.electron.sendRequestAsync<Result>(
            new PersistKeyBundleCommand(generationResult.data!.cacheToken),
        );

        if (!persistResult.success) {
            console.error('Error persisting keys locally: ' + persistResult.errorMessage);
            return Result.fail(new ErrorMessage(null, 'Error persisting keys locally'));
        }

        return Result.success();
    }

    public async GetKeyBundle(connectionId: string): Promise<Result<PreKeyBundle>> {
        return await this.getPreKeyBundleApi.getPreKeyBundle(connectionId);
    }

}
