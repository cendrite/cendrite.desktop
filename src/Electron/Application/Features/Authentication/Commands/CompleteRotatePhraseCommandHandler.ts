import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CompleteRotatePhraseCommand } from '#shared/Authentication/CompleteRotatePhrase';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { IPendingRotationStore, PendingRotation } from '#electron/Application/Contracts/Services/IPendingRotationStore';
import { deriveAccountKey, signAccountRotation } from '#electron/Infrastructure/Crypto/AccountKey';

export class CompleteRotatePhraseCommandHandler implements Handler<CompleteRotatePhraseCommand, void> {
    constructor(
        private readonly pendingRotationStore: IPendingRotationStore,
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly nonceSigner: INonceSigner,
    ) { }

    public async handle(cmd: CompleteRotatePhraseCommand): Promise<Result<void>> {
        const pending = this.pendingRotationStore.get();
        if (!pending) {
            return Result.fail<void>(new ErrorMessage('Expired', 'This has expired. Please start again.'));
        }

        if (!confirmationsMatch(pending, cmd.confirmations)) {
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

            this.pendingRotationStore.clear();
            return Result.success();
        } finally {
            newAccountKey.secretKey.fill(0);
        }
    }
}

function confirmationsMatch(pending: PendingRotation, confirmations: string[]): boolean {
    return (
        confirmations.length === pending.confirmIndices.length &&
        pending.confirmIndices.every((index, i) => confirmations[i]?.trim().toLowerCase() === pending.words[index])
    );
}
