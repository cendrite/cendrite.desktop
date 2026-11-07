import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { BeginRotatePhraseCommand, BeginRotatePhraseResponse } from '#shared/Authentication/BeginRotatePhrase';
import { IPendingRotationStore } from '#electron/Application/Contracts/Services/IPendingRotationStore';
import { generateRecoveryPhrase } from '#electron/Infrastructure/Crypto/AccountKey';
import { pickConfirmIndices } from '#electron/Application/Services/RecoveryPhrase/PhraseConfirmation';

export class BeginRotatePhraseCommandHandler implements Handler<BeginRotatePhraseCommand, BeginRotatePhraseResponse> {
    constructor(private readonly pendingRotationStore: IPendingRotationStore) { }

    public async handle(_cmd: BeginRotatePhraseCommand): Promise<Result<BeginRotatePhraseResponse>> {
        this.pendingRotationStore.clear();

        const words = generateRecoveryPhrase();
        const confirmIndices = pickConfirmIndices(words.length);

        this.pendingRotationStore.set({ words, confirmIndices });

        return Result.success({ words: [...words], confirmIndices });
    }
}
