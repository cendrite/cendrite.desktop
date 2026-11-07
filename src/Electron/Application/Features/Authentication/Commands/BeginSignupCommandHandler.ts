import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { BeginSignupCommand, BeginSignupResponse } from '#shared/Authentication/BeginSignup';
import { IPendingSignupStore } from '#electron/Application/Contracts/Services/IPendingSignupStore';
import { generateRecoveryPhrase } from '#electron/Infrastructure/Crypto/AccountKey';
import { pickConfirmIndices } from '#electron/Application/Services/RecoveryPhrase/PhraseConfirmation';

export class BeginSignupCommandHandler implements Handler<BeginSignupCommand, BeginSignupResponse> {
    constructor(private readonly pendingSignupStore: IPendingSignupStore) { }

    public async handle(_cmd: BeginSignupCommand): Promise<Result<BeginSignupResponse>> {
        this.pendingSignupStore.clear();

        const words = generateRecoveryPhrase();
        const confirmIndices = pickConfirmIndices(words.length);

        this.pendingSignupStore.set({ words, confirmIndices, registration: null });

        return Result.success({ words: [...words], confirmIndices });
    }
}
