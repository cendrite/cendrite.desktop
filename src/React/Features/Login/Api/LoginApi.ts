import { AxiosError, AxiosResponse } from "axios";
import { Result } from "../../../../Shared/Result/Result";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { LoginRequest, LoginResponse } from "./LoginRequest";
import { Envelope } from "../../../Common/Api/Envelope";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";

export class LoginApi extends AuthenticationBaseAPI<LoginRequest, LoginResponse> {
    public async handle(request: LoginRequest): Promise<Result<LoginResponse>> {
        try {
            const response: AxiosResponse<Envelope<LoginResponse>> = await this.api.post('Authentication/login', request);

            return Result.success(response.data.result!);
        }
        catch (error: unknown) {
            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while registering.";
                return Result.fail<LoginResponse>(
                    ErrorMessage.fromApiResponse("RegistrationFailed", errorMessage)
                );
            }

            // Debug unexpected errors
            console.error("Unexpected error during registration:", error);

            return Result.fail<LoginResponse>(
                ErrorMessage.fromApiResponse("RegistrationFailed", "An unexpected error occurred.")
            );
        }
    }

}