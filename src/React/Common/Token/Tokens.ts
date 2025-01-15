export interface Tokens {
    jwt: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
}