import { AxiosError } from "axios";
import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage";
import { Result } from "../../../../../Shared/Result/Result";
import { AuthenticationBaseAPI } from "../../../../Common/Api/BaseApi";
import { ResendCodeRequest } from "./ResendCodeRequest";

export class ResendCodeApi extends AuthenticationBaseAPI<ResendCodeRequest> {
    public async handle(request: ResendCodeRequest): Promise<Result<void>> {
        try {

            await this.api.put("/resend-verification", request);
            return Result.success();

        } catch (error) {

            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while registering.";
                return Result.fail(ErrorMessage.fromApiResponse("RegistrationFailed", errorMessage));
            }

            console.error("Unexpected error during registration:", error);

            return Result.fail(ErrorMessage.fromApiResponse("RegistrationFailed", "An unexpected error occurred."));
        }
    }

}