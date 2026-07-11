import { Result } from "../../../../Shared/Result/Result.js";

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

export interface IDeviceProvider {
    createDevice(req: CreateDeviceApiRequest): Promise<Result<CreateDeviceApiResponse>>;
}
