export interface RefreshTokenApiResponse {
    jwt: string;
    refreshToken: string;
    expiresAt: string;
}