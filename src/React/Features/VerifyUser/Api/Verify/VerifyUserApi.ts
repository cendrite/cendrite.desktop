import { AxiosError } from "axios";
import { Result } from "../../../../../Shared/Result/Result";
import { AuthenticationBaseAPI } from "../../../../Common/Api/BaseApi";
import { VerifyUserRequest } from "./VerifyUserRequest";
import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage";

export class VerifyUserApi extends AuthenticationBaseAPI<VerifyUserRequest> {

    public async handle(request: VerifyUserRequest): Promise<Result> {
        try {
            await this.api.put('/verify', request)
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
