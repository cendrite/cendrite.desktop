import { Tokens } from "./Tokens";

export class TokenManager {
    private static instance: TokenManager;
    private tokens: Tokens;
    private refreshInterval: ReturnType<typeof setInterval> | null = null;

    private constructor() {
        this.tokens = {
            jwt: null,
            refreshToken: null,
            expiresAt: null
        };
    }

    public static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }

        return TokenManager.instance;
    }

    public getTokens(): Tokens {
        return this.tokens;
    }

    public async initializeTokens(): Promise<void> {
        // fetch token from storage

        // if token is expired, call refreshtoken api

        // if refreshtoken api fails, default to nonce flow
    }

    private async refreshTokens(refreshToken: string): Promise<void> {
    }

    private async generateTokensViaNonce(): Promise<void> {

    }

    private async startBackgroundTokenRefresh(): Promise<void> {

    }
}