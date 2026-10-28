import { Result } from "#shared/Result/Result";
import { DeviceDto } from "#shared/Devices/GetDevices";

export interface CreateDeviceApiRequest {
    userId: string;
    loginNonceId: string;
    loginNonce: string;
    deviceAppVersion: string;
    deviceType: number;
    devicePlatform: number;
    base64DevicePublicKey: string;
}

export interface CreateDeviceApiResponse {
    deviceId: string;
    deviceConnectionId: string;
}

export interface GetDevicesApiResponse {
    devices: DeviceDto[];
}

export interface IDeviceProvider {
    createDevice(req: CreateDeviceApiRequest): Promise<Result<CreateDeviceApiResponse>>;
    getDevices(): Promise<Result<GetDevicesApiResponse>>;
    deleteDevice(deviceId: string): Promise<Result>;
}
