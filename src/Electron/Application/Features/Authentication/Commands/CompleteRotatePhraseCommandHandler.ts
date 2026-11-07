import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CompleteRotatePhraseCommand } from '#shared/Authentication/CompleteRotatePhrase';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { IEphemeralStore } from '#electron/Application/Contracts/Services/IEphemeralStore';
import { deriveAccountKey, signAccountRotation } from '#electron/Infrastructure/Crypto/AccountKey';
import { confirmationsMatch } from '#electron/Application/Services/RecoveryPhrase/PhraseConfirmation';

export class CompleteRotatePhraseCommandHandler implements Handler<CompleteRotatePhraseCommand, void> {
    constructor(
        private readonly ephemeralStore: IEphemeralStore,
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly nonceSigner: INonceSigner,
    ) { }

    public async handle(cmd: CompleteRotatePhraseCommand): Promise<Result<void>> {
        const pending = this.ephemeralStore.get('rotation');
        if (!pending) {
            return Result.fail<void>(new ErrorMessage('Expired', 'This has expired. Please start again.'));
        }

        if (!confirmationsMatch(pending.words, pending.confirmIndices, cmd.confirmations)) {
            return Result.fail<void>(new ErrorMessage('Validation', "Those words don't match your new recovery phrase."));
        }

        const current = await this.authenticationProvider.getAccountKey();
        if (!current.success) return current;

        const newAccountKey = deriveAccountKey(pending.words);

        try {
            const oldPublicKey = current.data.accountPublicKey;
            const newPublicKey = Buffer.from(newAccountKey.publicKey).toString('base64');

            const result = await this.authenticationProvider.rotateAccountKey({
                newAccountPublicKey: newPublicKey,
                proof: signAccountRotation(newAccountKey, Buffer.from(oldPublicKey, 'base64')),
                approval: await this.nonceSigner.signAccountRotation(oldPublicKey, newPublicKey),
            });
            if (!result.success) return result;

            this.ephemeralStore.clear('rotation');
            return Result.success();
        } finally {
            newAccountKey.secretKey.fill(0);
        }
    }
}
