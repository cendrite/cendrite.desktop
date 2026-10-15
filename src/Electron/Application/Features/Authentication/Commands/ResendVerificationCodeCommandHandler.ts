import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { CodeType } from '#shared/Enums/CodeType';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { IPendingLoginStore } from '#electron/Application/Contracts/Services/IPendingLoginStore';
import { Handler } from '#electron/Application/Mediator/Handler';
import { ResendVerificationCodeCommand } from '#shared/Authentication/ResendVerificationCode';

export class ResendVerificationCodeCommandHandler implements Handler<ResendVerificationCodeCommand> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly pendingLoginStore: IPendingLoginStore,
    ) { }

    public async handle(cmd: ResendVerificationCodeCommand): Promise<Result> {
        if (cmd.codeType !== CodeType.Login) {
            return this.authenticationProvider.resendVerificationCode({
                userId: cmd.userId,
                codeType: cmd.codeType,
            });
        }

        const pendingLogin = this.pendingLoginStore.get(cmd.userId);
        if (!pendingLogin) {
            return Result.fail(new ErrorMessage('Unauthorized', 'Your login has expired. Please log in again.'));
        }

        return this.authenticationProvider.resendVerificationCode({
            userId: cmd.userId,
            codeType: cmd.codeType,
            nonceId: pendingLogin.nonceId,
            nonce: pendingLogin.nonce,
        });
    }
}
