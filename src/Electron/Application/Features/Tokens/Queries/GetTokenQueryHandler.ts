import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../Shared/Result/Result.js";
import { Handler } from "../../../Mediator/Handler.js";
import { TokenManager } from "../../../Services/Authentication/TokenManager.js";
import { GetTokenQuery } from "./GetTokenQuery.js";

export class GetTokenQueryHandler implements Handler<GetTokenQuery, string> {

    public async handle(_request: GetTokenQuery): Promise<Result<string>> {
        try {
            const tokenManager = TokenManager.getInstance();
            return Result.success(tokenManager.getJwt());
        } catch (error) {
            console.error("Error retrieving token:", error);
            return Result.fail<string>(new ErrorMessage(null, "Failed to retrieve token"));
        }
    }
}
