import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CancelRotatePhraseCommand } from '#shared/Authentication/CancelRotatePhrase';
import { IPendingFlowStore } from '#electron/Application/Contracts/Services/IPendingFlowStore';

export class CancelRotatePhraseCommandHandler implements Handler<CancelRotatePhraseCommand, void> {
    constructor(private readonly pendingFlowStore: IPendingFlowStore) { }

    public async handle(_cmd: CancelRotatePhraseCommand): Promise<Result<void>> {
        this.pendingFlowStore.clear('rotation');
        return Result.success();
    }
}
