import { Result } from "#shared/Result/Result";
import { DeviceDto } from "#shared/Devices/GetDevices";

export interface GetDevicesApiResponse {
    devices: DeviceDto[];
}

export interface IDeviceProvider {
    getDevices(): Promise<Result<GetDevicesApiResponse>>;
    deleteDevice(deviceId: string): Promise<Result>;
}
