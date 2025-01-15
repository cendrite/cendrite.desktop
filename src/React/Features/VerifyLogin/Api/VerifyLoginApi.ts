import { AxiosError, AxiosResponse } from "axios";
import { Result } from "../../../../Shared/Result/Result";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { Envelope } from "../../../Common/Api/Envelope";
import { VerifyLoginRequest } from "./VerifyLoginRequest";
import { VerifyLoginResponse } from "./VerifyLoginResponse";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";

export class VerifyLoginApi extends AuthenticationBaseAPI<VerifyLoginRequest, VerifyLoginResponse> {
    public async handle(request: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>> {
        try {
            const response: AxiosResponse<Envelope<VerifyLoginResponse>> = await this.api.post('Authentication/verify-login', request);

            return Result.success(response.data.result!);
        }
        catch (error: unknown) {

            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while registering.";
                return Result.fail<VerifyLoginResponse>(
                    ErrorMessage.fromApiResponse("RegistrationFailed", errorMessage)
                );
            }
            console.error("Unexpected error during verification:", error);

            return Result.fail<VerifyLoginResponse>(
                ErrorMessage.fromApiResponse("VerificationFailed", "An unexpected error occurred.")
            );
        }
    }

}