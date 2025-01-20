import { AxiosError, AxiosResponse } from "axios";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { Envelope } from "../../../Common/Api/Envelope";
import { Result } from "../../../../Shared/Result/Result";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";

export interface GetNonceRequest {
    UserId: string;
    DeviceId: string;
}

export interface GetNonceResponse {
    nonceId: string;
    deviceId: string;
    nonceValue: string;
}

export class GetNonceApi extends AuthenticationBaseAPI<GetNonceRequest, GetNonceResponse> {

    public async handle(request: GetNonceRequest): Promise<Result<GetNonceResponse>> {
        try {
            const response: AxiosResponse<Envelope<GetNonceResponse>> = await this.api.get("Authentication/nonce", {
                params: {
                    userId: request.UserId,
                    deviceId: request.DeviceId,
                }
            });
            return Result.success(response.data.result!);


        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while getting nonce.";
                return Result.fail<GetNonceResponse>(
                    ErrorMessage.fromApiResponse("GetNonceFailed", errorMessage)
                );
            }

            // Debug unexpected errors
            console.error("Unexpected error during getting nonce:", error);

            return Result.fail<GetNonceResponse>(
                ErrorMessage.fromApiResponse("GetNonceFailed", "An unexpected error occurred.")
            );
        }
    }
}