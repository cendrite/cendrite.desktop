import { randomInt } from 'node:crypto';
import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { BeginSignupCommand, BeginSignupResponse } from '#shared/Authentication/BeginSignup';
import { IPendingSignupStore } from '#electron/Application/Contracts/Services/IPendingSignupStore';
import { generateRecoveryPhrase } from '#electron/Infrastructure/Crypto/AccountKey';

const CONFIRM_WORD_COUNT = 3;

export class BeginSignupCommandHandler implements Handler<BeginSignupCommand, BeginSignupResponse> {
    constructor(private readonly pendingSignupStore: IPendingSignupStore) { }

    public async handle(_cmd: BeginSignupCommand): Promise<Result<BeginSignupResponse>> {
        this.pendingSignupStore.clear();

        const words = generateRecoveryPhrase();
        const confirmIndices = pickIndices(words.length, CONFIRM_WORD_COUNT);

        this.pendingSignupStore.set({ words, confirmIndices, registration: null });

        return Result.success({ words: [...words], confirmIndices });
    }
}

function pickIndices(total: number, count: number): number[] {
    const picked = new Set<number>();
    while (picked.size < count) {
        picked.add(randomInt(total));
    }
    return [...picked].sort((a, b) => a - b);
}
