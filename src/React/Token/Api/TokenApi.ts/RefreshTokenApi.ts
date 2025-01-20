import { AxiosError, AxiosResponse } from "axios";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { Envelope } from "../../../Common/Api/Envelope";
import { Result } from "../../../../Shared/Result/Result";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";

export interface RefreshTokenApiResponse {
    jwt: string;
    refreshToken: string;
    expiresAt: string;
}

export interface RefreshTokenApiRequest {
    userId: string;
    deviceId: string;
    refreshToken: string;
}

export class RefreshTokenApi extends AuthenticationBaseAPI<RefreshTokenApiRequest, RefreshTokenApiResponse> {
    public async handle(request: RefreshTokenApiRequest): Promise<Result<RefreshTokenApiResponse>> {
        try {
            const response: AxiosResponse<Envelope<RefreshTokenApiResponse>> = await this.api.post('Authentication/refresh-token', request);

            return Result.success(response.data.result!);
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