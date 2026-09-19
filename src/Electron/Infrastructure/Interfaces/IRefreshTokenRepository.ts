import { RefreshToken } from '../../Domain/Entities/RefreshToken.js';

export interface IRefreshTokenRepository {
    create(refreshToken: RefreshToken): Promise<RefreshToken>;
    get(): Promise<RefreshToken | null>;
    delete(): Promise<void>;
}
