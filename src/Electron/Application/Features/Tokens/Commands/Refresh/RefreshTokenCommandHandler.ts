import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { TokenManager } from "../../../../../Infrastructure/Services/TokenManager.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { RefreshTokenCommand } from "./RefreshTokenCommand.js";

export class RefreshTokenCommandHandler implements Handler<RefreshTokenCommand, string> {
    constructor(private readonly tokenManager: TokenManager) {}

    public async handle(_request: RefreshTokenCommand): Promise<Result<string>> {
        try {
            await this.tokenManager.refreshTokens();
            return Result.success(this.tokenManager.getJwt());
        } catch (error) {
            console.error("Error initializing token manager:", error);
            return Result.fail<string>(new ErrorMessage(null, "Failed to initialize token manager."));
        }
    }
}
