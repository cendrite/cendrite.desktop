import { RefreshToken } from '#electron/Domain/Entities/RefreshToken';

export interface IRefreshTokenRepository {
    create(refreshToken: RefreshToken): Promise<RefreshToken>;
    get(): Promise<RefreshToken | null>;
    delete(): Promise<void>;
}
