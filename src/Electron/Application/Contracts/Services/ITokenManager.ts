export interface ITokenManager {
    init(userId: string, deviceId: string): Promise<void>;
    disableAndClear(): void;
}
