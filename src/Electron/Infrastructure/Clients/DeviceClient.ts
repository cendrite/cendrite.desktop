import { Result } from "../../../Shared/Result/Result.js";
import { CreateDeviceApiRequest as CreateDeviceRequest, CreateDeviceApiResponse, IDeviceProvider } from "../../Application/Contracts/Providers/IDeviceProvider.js";
import { ApiClient } from "./Base/ApiClient.js";

export class DeviceClient implements IDeviceProvider {
    private readonly client: ApiClient;

    constructor(deviceApiClient: ApiClient) {
        this.client = deviceApiClient;
    }

    createDevice(req: CreateDeviceRequest): Promise<Result<CreateDeviceApiResponse>> {
        return this.client.handle<CreateDeviceApiResponse>({
            method: "POST",
            data: req 
        });
    }
}
