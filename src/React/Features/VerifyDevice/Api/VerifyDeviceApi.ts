import { AxiosError } from "axios";
import { AuthenticationBaseAPI } from "../../../Common/Api/BaseApi";
import { VerifyDeviceRequest } from "./VerifyDeviceRequest";
import { Result } from "../../../../Shared/Result/Result";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";


export class VerifyDeviceApi extends AuthenticationBaseAPI<VerifyDeviceRequest> {

    public async handle(request: VerifyDeviceRequest): Promise<Result> {
        try {
            await this.api.put("/user/device/verify", request);
            return Result.success();

        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while verifying device.";
                return Result.fail(ErrorMessage.fromApiResponse("VerifyDeviceFailed", errorMessage));
            }

            console.error("Unexpected error during device verification:", error);

            return Result.fail(ErrorMessage.fromApiResponse("VerifyDeviceFailed", "An unexpected error occurred."));
        }
    }
}