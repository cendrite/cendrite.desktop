import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { BeginSignupCommand, BeginSignupResponse } from '#shared/Authentication/BeginSignup';
import { IEphemeralStore } from '#electron/Application/Contracts/Services/IEphemeralStore';
import { generateRecoveryPhrase } from '#electron/Infrastructure/Crypto/AccountKey';
import { pickConfirmIndices } from '#electron/Application/Services/RecoveryPhrase/PhraseConfirmation';

export class BeginSignupCommandHandler implements Handler<BeginSignupCommand, BeginSignupResponse> {
    constructor(private readonly ephemeralStore: IEphemeralStore) { }

    public async handle(_cmd: BeginSignupCommand): Promise<Result<BeginSignupResponse>> {
        this.ephemeralStore.clear('signup');

        const words = generateRecoveryPhrase();
        const confirmIndices = pickConfirmIndices(words.length);

        this.ephemeralStore.set('signup', { words, confirmIndices, registration: null });

        return Result.success({ words: [...words], confirmIndices });
    }
}
