import { AxiosError, AxiosResponse } from "axios";
import { Result } from "../../../../Common/Result/Result";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { VerifyUserRequest } from "./VerifyUserRequest";
import { Envelope } from "../../../Common/Api/Envelope";
import { ErrorMessage } from "../../../../Common/Result/ErrorMessage";

export class VerifyUserApi extends AuthenticationBaseAPI<VerifyUserRequest> {

    public async handle(request: VerifyUserRequest): Promise<Result> {
        try {
            const repsone: AxiosResponse<Envelope> = await this.api.put('/verify', request)
            if (repsone.status === 200) {
                return Result.success();
            }
            else {
                const errorMessage = repsone.data.errorMessage || "Unknown error occurred during verification.";
                return Result.fail(ErrorMessage.fromApiResponse("VerificationFailed", errorMessage));
            }

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
