import { Result } from "#shared/Result/Result";
import { GetDevicesApiResponse, IDeviceProvider } from "#electron/Application/Contracts/Providers/IDeviceProvider";
import { ApiClient } from "./Base/ApiClient.js";

export class DeviceClient implements IDeviceProvider {
    private readonly managementClient: ApiClient;

    constructor(deviceManagementApiClient: ApiClient) {
        this.managementClient = deviceManagementApiClient;
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
