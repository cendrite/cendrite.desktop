import { AxiosError, AxiosResponse } from "axios";
import { Result } from "../../../../Shared/Result/Result";
import { AuthenticationBaseAPI } from "../BaseApi";
import { CreateDeviceApiRequest } from "./CreateDeviceApiRequest";
import { CreateDeviceApiResponse } from "./CreateDeviceApiResponse";
import { ErrorMessage } from "../../../../Shared/Result/ErrorMessage";
import { Envelope } from "../Envelope";

export class CreateDeviceApi extends AuthenticationBaseAPI<CreateDeviceApiRequest, CreateDeviceApiResponse> {

    public async handle(request: CreateDeviceApiRequest): Promise<Result<CreateDeviceApiResponse>> {
        try {
            const response: AxiosResponse<Envelope<CreateDeviceApiResponse>> = await this.api.post("User/device", request);
            return Result.success(response.data.result!);

        } catch (error) {

            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while creating device.";
                return Result.fail<CreateDeviceApiResponse>(
                    ErrorMessage.fromApiResponse("CreateDeviceFailed", errorMessage)
                );
            }

            // log unexp errors
            console.error("Unexpected error during creating device:", error);

            return Result.fail<CreateDeviceApiResponse>(
                ErrorMessage.fromApiResponse("CreateDeviceFailed", "An unexpected error occurred.")
            );
        }
    }
}