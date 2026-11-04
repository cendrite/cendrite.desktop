import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CancelSignupCommand } from '#shared/Authentication/Signup';
import { IPendingSignupStore } from '#electron/Application/Contracts/Services/IPendingSignupStore';

export class CancelSignupCommandHandler implements Handler<CancelSignupCommand, void> {
    constructor(private readonly pendingSignupStore: IPendingSignupStore) { }

    public async handle(_cmd: CancelSignupCommand): Promise<Result<void>> {
        this.pendingSignupStore.clear();
        return Result.success();
    }
}
