import { Result } from "#shared/Result/Result";
import { CreateDeviceApiRequest as CreateDeviceRequest, CreateDeviceApiResponse, GetDevicesApiResponse, IDeviceProvider } from "#electron/Application/Contracts/Providers/IDeviceProvider";
import { ApiClient } from "./Base/ApiClient.js";

export class DeviceClient implements IDeviceProvider {
    private readonly client: ApiClient;
    private readonly managementClient: ApiClient;

    constructor(deviceApiClient: ApiClient, deviceManagementApiClient: ApiClient) {
        this.client = deviceApiClient;
        this.managementClient = deviceManagementApiClient;
    }

    createDevice(req: CreateDeviceRequest): Promise<Result<CreateDeviceApiResponse>> {
        return this.client.handleConduit<CreateDeviceApiResponse>({
            method: "POST",
            data: req 
        });
    }

    getDevices(): Promise<Result<GetDevicesApiResponse>> {
        return this.managementClient.handleConduit<GetDevicesApiResponse>({
            method: "GET",
            url: "devices",
        });
    }

    deleteDevice(deviceId: string): Promise<Result> {
        return this.managementClient.handleConduit<void>({
            method: "DELETE",
            url: `device/${deviceId}`,
        }, true);
    }
}
