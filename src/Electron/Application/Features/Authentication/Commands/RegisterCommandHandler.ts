import { Result } from '#shared/Result/Result';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { RegisterCommand, RegisterResponse } from '#shared/Authentication/Register';

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
