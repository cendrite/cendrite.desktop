import { AxiosError, AxiosResponse } from "axios";
import { AuthenticationBaseAPI } from "../../../Api/BaseApi";
import { Envelope } from "../../../Api/Envelope";
import { Result } from "../../../../../Shared/Result/Result";
import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage";

export interface VerifyNonceRequest {
    userId: string;
    deviceId: string;
    nonceId: string;
    nonce: string;
}

export interface VerifyNonceResponse {
    jwt: string;
    refreshToken: string;
    expiresAt: string;
}

export class VerifyNonceApi extends AuthenticationBaseAPI<VerifyNonceRequest, VerifyNonceResponse> {

    public async handle(request: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>> {
        try {
            const response: AxiosResponse<Envelope<VerifyNonceResponse>> = await this.api.post("Authentication/verify-nonce", request);

            return Result.success(response.data.result!);
        }
        catch (error) {
            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while verifying nonce.";
                return Result.fail<VerifyNonceResponse>(ErrorMessage.fromApiResponse("Nonce verification failed", errorMessage));
            }

            console.error("Unexpected error during verifying nonce:", error);

            return Result.fail<VerifyNonceResponse>(new ErrorMessage(null, "An unexpected error occurred."));
        }
    }
}