import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CancelSignupCommand } from '#shared/Authentication/CancelSignup';
import { IEphemeralStore } from '#electron/Application/Contracts/Services/IEphemeralStore';

export class CancelSignupCommandHandler implements Handler<CancelSignupCommand, void> {
    constructor(private readonly ephemeralStore: IEphemeralStore) { }

    public async handle(_cmd: CancelSignupCommand): Promise<Result<void>> {
        this.ephemeralStore.clear('signup');
        return Result.success();
    }
}
