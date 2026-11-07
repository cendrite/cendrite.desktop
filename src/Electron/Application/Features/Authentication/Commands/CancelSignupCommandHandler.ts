import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CancelSignupCommand } from '#shared/Authentication/CancelSignup';
import { IPendingFlowStore } from '#electron/Application/Contracts/Services/IPendingFlowStore';

export class CancelSignupCommandHandler implements Handler<CancelSignupCommand, void> {
    constructor(private readonly pendingFlowStore: IPendingFlowStore) { }

    public async handle(_cmd: CancelSignupCommand): Promise<Result<void>> {
        this.pendingFlowStore.clear('signup');
        return Result.success();
    }
}
