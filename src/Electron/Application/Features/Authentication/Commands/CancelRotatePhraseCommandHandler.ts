import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CancelRotatePhraseCommand } from '#shared/Authentication/CancelRotatePhrase';
import { IEphemeralStore } from '#electron/Application/Contracts/Services/IEphemeralStore';

export class CancelRotatePhraseCommandHandler implements Handler<CancelRotatePhraseCommand, void> {
    constructor(private readonly ephemeralStore: IEphemeralStore) { }

    public async handle(_cmd: CancelRotatePhraseCommand): Promise<Result<void>> {
        this.ephemeralStore.clear('rotation');
        return Result.success();
    }
}
