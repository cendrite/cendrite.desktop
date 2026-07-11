import { Result } from "../../../../../Shared/Result/Result.js";
import { IAuthenticationProvider } from "../../../Contracts/Providers/IAuthenticationProvider.js";
import { Handler } from "../../../Mediator/Handler.js";
import { LoginResponse } from "../Contracts/Login.js";
import { LoginCommand } from "../Contracts/Login.js";

export class LoginCommandHandler implements Handler<LoginCommand, LoginResponse> {
    
    constructor(private readonly authenticationProvider: IAuthenticationProvider) { }

    handle(cmd: LoginCommand): Promise<Result<LoginResponse>> {
        console.log("LoginCommandHandler.handle: ", cmd.email, cmd.password);
        return this.authenticationProvider.login({
            email: cmd.email,
            password: cmd.password,
        });
    }
}
