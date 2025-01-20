export interface CreateDeviceApiRequest {
    userId: string;
    loginNonceId: string;
    loginNonce: string;
    deviceAppVersion: string;
    deviceType: number;
    devicePlatform: number;
    base64DevicePublicKey: string;
}