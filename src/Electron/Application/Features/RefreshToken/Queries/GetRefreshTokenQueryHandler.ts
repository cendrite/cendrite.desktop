import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../Shared/Result/Result.js";
import { RefreshTokenRepository } from "../../../../Persistence/Repositories/RefreshTokenRepository.js";
import { Handler } from "../../../Mediator/Handler.js";
import { GetRefreshTokenDto } from "./GetRefreshTokenDto.js";
import { GetRefreshTokenQuery } from "./GetRefreshTokenQuery.js";

export class GetRefreshTokenQueryHandler implements Handler<GetRefreshTokenQuery, GetRefreshTokenDto> {

    public async handle(request: GetRefreshTokenQuery): Promise<Result<GetRefreshTokenDto>> {

        try {

            const _refreshTokenRepository = new RefreshTokenRepository();
            const refreshToken = await _refreshTokenRepository.get();

            if (!refreshToken) {
                return Result.fail<GetRefreshTokenDto>(new ErrorMessage("entity.not.found", "Refresh Token Not Found"));
            }

            const dto = GetRefreshTokenDto.MapFrom(refreshToken);

            return Result.success<GetRefreshTokenDto>(dto);
        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Get Refresh Token Failed:', errorMessage);
            return Result.fail<GetRefreshTokenDto>(new ErrorMessage(null, "Get Refresh Token Failed"));
        }
    }
}