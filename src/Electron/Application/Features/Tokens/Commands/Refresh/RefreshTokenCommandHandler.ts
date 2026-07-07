import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { TokenManager } from "../../../../Services/Authentication/TokenManager.js";
import { RefreshTokenCommand } from "./RefreshTokenCommand.js";

export class RefreshTokenCommandHandler implements Handler<RefreshTokenCommand, string> {
    public async handle(_request: RefreshTokenCommand): Promise<Result<string>> {
        try {
            const tokenManager = TokenManager.getInstance();
            await tokenManager.refreshTokens();
            return Result.success(tokenManager.getJwt());
        } catch (error) {
            console.error("Error initializing token manager:", error);
            return Result.fail<string>(new ErrorMessage(null, "Failed to initialize token manager."));
        }
    }
}
