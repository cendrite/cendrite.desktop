import { Result } from '#shared/Result/Result';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { LoginResponse } from '#shared/Authentication/Login';
import { LoginCommand } from '#shared/Authentication/Login';

export class LoginCommandHandler implements Handler<LoginCommand, LoginResponse> {
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    handle(cmd: LoginCommand): Promise<Result<LoginResponse>> {
        return this.authenticationProvider.login({
            email: cmd.email,
            password: cmd.password,
        });
    }
}
