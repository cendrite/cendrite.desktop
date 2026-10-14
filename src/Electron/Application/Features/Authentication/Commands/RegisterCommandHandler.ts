import { Result } from '../../../../../Shared/Result/Result.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { RegisterCommand, RegisterResponse } from '../../../../../Shared/Contracts/Authentication/Register.js';

export class RegisterCommandHandler implements Handler<RegisterCommand, RegisterResponse> {
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    public handle(cmd: RegisterCommand): Promise<Result<RegisterResponse>> {
        return this.authenticationProvider.register({
            username: cmd.username,
            email: cmd.email,
            password: cmd.password,
        });
    }
}
