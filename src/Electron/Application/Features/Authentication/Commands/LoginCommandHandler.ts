import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { IPendingLoginStore } from '#electron/Application/Contracts/Services/IPendingLoginStore';
import { Handler } from '#electron/Application/Mediator/Handler';
import { LoginResponse } from '#shared/Authentication/Login';
import { LoginCommand } from '#shared/Authentication/Login';

export class LoginCommandHandler implements Handler<LoginCommand, LoginResponse> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly pendingLoginStore: IPendingLoginStore,
    ) { }

    async handle(cmd: LoginCommand): Promise<Result<LoginResponse>> {
        const result = await this.authenticationProvider.login({
            email: cmd.email,
            password: cmd.password,
        });

        if (!result.success) {
            if (result.errorMessage.code === 'Unauthorized') {
                return Result.fail<LoginResponse>(new ErrorMessage('Unauthorized', 'Invalid Credentials'));
            }
            return result;
        }

        this.pendingLoginStore.clear();

        if (result.data.nonceId && result.data.nonce) {
            this.pendingLoginStore.set({
                userId: result.data.userId,
                nonceId: result.data.nonceId,
                nonce: result.data.nonce,
            });
        }

        return Result.success<LoginResponse>({
            userId: result.data.userId,
            isVerified: result.data.isVerified,
        });
    }
}
