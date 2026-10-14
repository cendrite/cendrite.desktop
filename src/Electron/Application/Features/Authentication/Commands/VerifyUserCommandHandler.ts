import { Result } from '#shared/Result/Result';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { VerifyUserCommand } from '#shared/Authentication/VerifyUser';

export class VerifyUserCommandHandler implements Handler<VerifyUserCommand> {
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    public handle(cmd: VerifyUserCommand): Promise<Result> {
        return this.authenticationProvider.verifyUser({
            userId: cmd.userId,
            verificationCode: cmd.verificationCode,
        });
    }
}
