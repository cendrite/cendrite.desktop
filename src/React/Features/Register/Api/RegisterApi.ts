import { AxiosError, AxiosResponse } from "axios";
import { Result } from "../../../../Shared/Result/Result";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { RegisterRequest, RegisterResponse } from "./RegisterRequest";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";
import { Envelope } from './../../../Common/Api/Envelope';

export class RegisterApi extends AuthenticationBaseAPI<RegisterRequest, RegisterResponse> {

    public async handle(request: RegisterRequest): Promise<Result<RegisterResponse>> {
        try {
            const response: AxiosResponse<Envelope<RegisterResponse>> = await this.api.post('User', request);

            if (response.status === 200) {
                return Result.success(response.data.result!);
            }

            const errorMessage = response.data.errorMessage || "Unknown error occurred during registration.";
            return Result.fail<RegisterResponse>(
                ErrorMessage.fromApiResponse("RegistrationFailed", errorMessage)
            );
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while registering.";
                return Result.fail<RegisterResponse>(
                    ErrorMessage.fromApiResponse("RegistrationFailed", errorMessage)
                );
            }

            // Debug unexpected errors
            console.error("Unexpected error during registration:", error);

            return Result.fail<RegisterResponse>(
                ErrorMessage.fromApiResponse("RegistrationFailed", "An unexpected error occurred.")
            );
        }
    }
}