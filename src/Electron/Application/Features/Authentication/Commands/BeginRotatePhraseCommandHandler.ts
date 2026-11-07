import { randomInt } from 'node:crypto';
import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { BeginRotatePhraseCommand, BeginRotatePhraseResponse } from '#shared/Authentication/BeginRotatePhrase';
import { IPendingRotationStore } from '#electron/Application/Contracts/Services/IPendingRotationStore';
import { generateRecoveryPhrase } from '#electron/Infrastructure/Crypto/AccountKey';

const CONFIRM_WORD_COUNT = 3;

export class BeginRotatePhraseCommandHandler implements Handler<BeginRotatePhraseCommand, BeginRotatePhraseResponse> {
    constructor(private readonly pendingRotationStore: IPendingRotationStore) { }

    public async handle(_cmd: BeginRotatePhraseCommand): Promise<Result<BeginRotatePhraseResponse>> {
        this.pendingRotationStore.clear();

        const words = generateRecoveryPhrase();
        const confirmIndices = pickIndices(words.length, CONFIRM_WORD_COUNT);

        this.pendingRotationStore.set({ words, confirmIndices });

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
