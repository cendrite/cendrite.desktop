export interface VerifyDeviceRequest {
    userId: string;
    deviceId: string;
    deviceVerificationCode: string;
}