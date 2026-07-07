import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { TokenManager } from "../../../../Services/Authentication/TokenManager.js";
import { InitializeTokenManagerCommand } from "./InitializeTokenMangerCommand.js";

export class InitializeTokenManagerCommandHandler implements Handler<InitializeTokenManagerCommand> {

    public async handle(request: InitializeTokenManagerCommand): Promise<Result<void>> {
        try {
            const tokenManager = TokenManager.getInstance();
            await tokenManager.init(request.userId, request.deviceId);
            return Result.success();
        } catch (error) {
            console.error("Error initializing token manager:", error);
            return Result.fail(new ErrorMessage(null, "Failed to initialize token manager."));
        }
    }
}
