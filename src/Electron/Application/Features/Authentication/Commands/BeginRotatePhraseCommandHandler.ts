import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { BeginRotatePhraseCommand, BeginRotatePhraseResponse } from '#shared/Authentication/BeginRotatePhrase';
import { IPendingFlowStore } from '#electron/Application/Contracts/Services/IPendingFlowStore';
import { generateRecoveryPhrase } from '#electron/Infrastructure/Crypto/AccountKey';
import { pickConfirmIndices } from '#electron/Application/Services/RecoveryPhrase/PhraseConfirmation';

export class BeginRotatePhraseCommandHandler implements Handler<BeginRotatePhraseCommand, BeginRotatePhraseResponse> {
    constructor(private readonly pendingFlowStore: IPendingFlowStore) { }

    public async handle(_cmd: BeginRotatePhraseCommand): Promise<Result<BeginRotatePhraseResponse>> {
        this.pendingFlowStore.clear('rotation');

        const words = generateRecoveryPhrase();
        const confirmIndices = pickConfirmIndices(words.length);

        this.pendingFlowStore.set('rotation', { words, confirmIndices });

        return Result.success({ words: [...words], confirmIndices });
    }
}
