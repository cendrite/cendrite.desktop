import { Result } from '../../../../../Shared/Result/Result.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { LoginResponse } from '../../../../../Shared/Contracts/Authentication/Login.js';
import { LoginCommand } from '../../../../../Shared/Contracts/Authentication/Login.js';

export class LoginCommandHandler implements Handler<LoginCommand, LoginResponse> {
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    handle(cmd: LoginCommand): Promise<Result<LoginResponse>> {
        return this.authenticationProvider.login({
            email: cmd.email,
            password: cmd.password,
        });
    }
}
