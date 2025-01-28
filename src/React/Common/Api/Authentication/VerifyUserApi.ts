import { AxiosError } from "axios";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { Result } from "../../../../Shared/Result/Result";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";

export interface VerifyUserRequest {
    userId: string;
    verificationCode: string;
}

export class VerifyUserApi extends AuthenticationBaseAPI<VerifyUserRequest> {

    public async handle(request: VerifyUserRequest): Promise<Result> {
        try {
            await this.api.put('user/verify', request)
            return Result.success();

        } catch (error) {

            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while registering.";
                return Result.fail(
                    ErrorMessage.fromApiResponse("RegistrationFailed", errorMessage)
                );
            }

            // log unexp errors
            console.error("Unexpected error during registration:", error);

            return Result.fail(
                ErrorMessage.fromApiResponse("RegistrationFailed", "An unexpected error occurred.")
            );
        }
    }
}
