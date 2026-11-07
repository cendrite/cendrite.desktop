import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CancelRotatePhraseCommand } from '#shared/Authentication/CancelRotatePhrase';
import { IPendingRotationStore } from '#electron/Application/Contracts/Services/IPendingRotationStore';

export class CancelRotatePhraseCommandHandler implements Handler<CancelRotatePhraseCommand, void> {
    constructor(private readonly pendingRotationStore: IPendingRotationStore) { }

    public async handle(_cmd: CancelRotatePhraseCommand): Promise<Result<void>> {
        this.pendingRotationStore.clear();
        return Result.success();
    }
}
