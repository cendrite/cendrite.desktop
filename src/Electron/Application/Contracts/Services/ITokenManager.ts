export const DEVICE_REVOKED_CODE = 'device.revoked';

export class DeviceRevokedError extends Error {
    constructor() {
        super('This device has been removed from the account.');
        this.name = 'DeviceRevokedError';
    }
}

export interface ITokenManager {
    init(userId: string, deviceId: string): Promise<void>;
    disableAndClear(): void;
}
