import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { RefreshToken } from "../../../../../Persistence/Entities/RefreshToken.js";
import { RefreshTokenRepository } from "../../../../../Persistence/Repositories/RefreshTokenRepository.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { CreateRefreshTokenRequest } from "./CreateRefreshTokenRequest.js";

export class CreateRefreshTokenRequestHandler implements Handler<CreateRefreshTokenRequest, void> {

    async handle(request: CreateRefreshTokenRequest): Promise<Result<void>> {
        try {

            const _refreshTokenRepository = new RefreshTokenRepository();
            await _refreshTokenRepository.deleteAll();
            const refreshToken = new RefreshToken();
            refreshToken.token = request.token;
            refreshToken.expiresAt = new Date(request.expiresAt);

            await _refreshTokenRepository.create(refreshToken);

            return Result.success();
        }
        catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Create Refresh Token Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Create Refresh Token Failed"));
        }
    }
}