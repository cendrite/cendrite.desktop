import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { RefreshTokenRepository } from "../../../../../Infrastructure/Persistence/Repositories/RefreshTokenRepository.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { CreateRefreshTokenRequest } from "./CreateRefreshTokenRequest.js";
import {RefreshToken} from "../../../../../Domain/Entities/RefreshToken.js";

export class CreateRefreshTokenRequestHandler implements Handler<CreateRefreshTokenRequest> {

    async handle(request: CreateRefreshTokenRequest): Promise<Result> {
        try {

            const _refreshTokenRepository = new RefreshTokenRepository();
            await _refreshTokenRepository.delete();
            const refreshToken = new RefreshToken(request.token, request.expiresAt);
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