import { Result } from '../../../../../Shared/Result/Result.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { VerifyUserCommand } from '../../../../../Shared/Authentication/VerifyUser.js';

export class VerifyUserCommandHandler implements Handler<VerifyUserCommand> {
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    public handle(cmd: VerifyUserCommand): Promise<Result> {
        return this.authenticationProvider.verifyUser({
            userId: cmd.userId,
            verificationCode: cmd.verificationCode,
        });
    }
}
