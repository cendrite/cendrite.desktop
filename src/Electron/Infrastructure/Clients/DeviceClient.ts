import { Result } from "#shared/Result/Result";
import { CreateDeviceApiRequest as CreateDeviceRequest, CreateDeviceApiResponse, IDeviceProvider } from "#electron/Application/Contracts/Providers/IDeviceProvider";
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
