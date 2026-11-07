import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { BeginSignupCommand, BeginSignupResponse } from '#shared/Authentication/BeginSignup';
import { IPendingFlowStore } from '#electron/Application/Contracts/Services/IPendingFlowStore';
import { generateRecoveryPhrase } from '#electron/Infrastructure/Crypto/AccountKey';
import { pickConfirmIndices } from '#electron/Application/Services/RecoveryPhrase/PhraseConfirmation';

export class BeginSignupCommandHandler implements Handler<BeginSignupCommand, BeginSignupResponse> {
    constructor(private readonly pendingFlowStore: IPendingFlowStore) { }

    public async handle(_cmd: BeginSignupCommand): Promise<Result<BeginSignupResponse>> {
        this.pendingFlowStore.clear('signup');

        const words = generateRecoveryPhrase();
        const confirmIndices = pickConfirmIndices(words.length);

        this.pendingFlowStore.set('signup', { words, confirmIndices, registration: null });

        return Result.success({ words: [...words], confirmIndices });
    }
}
