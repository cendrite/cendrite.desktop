export interface LoginRequest {
    email: string;
    password: string;
    base64DevicePublicKey: string;
    deviceAppVersion: string;
    deviceType: number;
    devicePlatform: number;
}

export interface LoginResponse {
    UserId: string;
    IsVerified: boolean;
    DeviceId: string | null;
}