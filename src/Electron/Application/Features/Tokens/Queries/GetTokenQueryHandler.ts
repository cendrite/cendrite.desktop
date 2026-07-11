import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../Shared/Result/Result.js";
import { TokenManager } from "../../../../Infrastructure/Services/TokenManager.js";
import { Handler } from "../../../Mediator/Handler.js";
import { GetTokenQuery } from "./GetTokenQuery.js";

export class GetTokenQueryHandler implements Handler<GetTokenQuery, string> {
    constructor(private readonly tokenManager: TokenManager) { }

    public async handle(_request: GetTokenQuery): Promise<Result<string>> {
        try {
            return Result.success(this.tokenManager.getJwt());
        } catch (error) {
            console.error("Error retrieving token:", error);
            return Result.fail<string>(new ErrorMessage(null, "Failed to retrieve token"));
        }
    }
}
