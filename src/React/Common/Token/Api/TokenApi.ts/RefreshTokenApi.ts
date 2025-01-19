import { AxiosError, AxiosResponse } from "axios";
import { Result } from "../../../../../Shared/Result/Result";
import { AuthenticationBaseAPI } from "../../../Api/BaseApi"
import { RefreshTokenApiRequest } from "./RefreshTokenApiRequest";
import { RefreshTokenApiResponse } from "./RefreshTokenApiResponse";
import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage";

export class RefreshTokenApi extends AuthenticationBaseAPI<RefreshTokenApiRequest, RefreshTokenApiResponse> {
    public async handle(request: RefreshTokenApiRequest): Promise<Result<RefreshTokenApiResponse>> {
        try {
            const response: AxiosResponse<RefreshTokenApiResponse> = await this.api.post('Authentication/refresh-token', request);

            return Result.success(response.data);
        }
        catch (error: unknown) {
            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while refreshing token.";
                return Result.fail<RefreshTokenApiResponse>(ErrorMessage.fromApiResponse("TokenRefreshFailed", errorMessage));
            }

            console.error("Unexpected error during token refresh:", error);

            return Result.fail<RefreshTokenApiResponse>(new ErrorMessage("TokenRefreshFailed", "An unexpected error occurred."));
        }
    }

}