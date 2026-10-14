import { Result } from '../../../../../Shared/Result/Result.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { ResendVerificationCodeCommand } from '../../../../../Shared/Contracts/Authentication/ResendVerificationCode.js';

export class ResendVerificationCodeCommandHandler implements Handler<ResendVerificationCodeCommand> {
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    public handle(cmd: ResendVerificationCodeCommand): Promise<Result> {
        return this.authenticationProvider.resendVerificationCode({
            userId: cmd.userId,
            codeType: cmd.codeType,
        });
    }
}
