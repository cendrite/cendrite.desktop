import { Result } from '#shared/Result/Result';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { ResendVerificationCodeCommand } from '#shared/Authentication/ResendVerificationCode';

export class ResendVerificationCodeCommandHandler implements Handler<ResendVerificationCodeCommand> {
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    public handle(cmd: ResendVerificationCodeCommand): Promise<Result> {
        return this.authenticationProvider.resendVerificationCode({
            userId: cmd.userId,
            codeType: cmd.codeType,
        });
    }
}
