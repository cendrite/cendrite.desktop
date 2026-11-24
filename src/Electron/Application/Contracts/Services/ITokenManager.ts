export const DEVICE_REVOKED_CODE = 'device.revoked';

export interface ITokenManager {
    init(userId: string, deviceId: string): Promise<void>;
    refreshTokens(): Promise<void>;
    disableAndClear(): void;
}
