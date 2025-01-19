import { Tokens } from "./Tokens";
import { GetRefreshTokenDto } from './../../../Electron/Application/Features/RefreshToken/Queries/GetRefreshTokenDto';
import { GetRefreshTokenQuery } from './../../../Electron/Application/Features/RefreshToken/Queries/GetRefreshTokenQuery';
import { Result } from "../../../Shared/Result/Result";
import { RefreshTokenApi } from "./Api/TokenApi.ts/RefreshTokenApi";

export class TokenManager {
    private static instance: TokenManager;
    private userId: string | null = null;
    private deviceId: string | null = null;
    private tokens: Tokens;
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private readonly refreshTokenApi = new RefreshTokenApi();

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

    public setUserId(userId: string): void {
        this.userId = userId;
    }

    public getTokens(): Tokens {
        return this.tokens;
    }

    public async initializeTokens(): Promise<void> {

        const refreshTokenResult = await window.electron.sendRequestAsync<Result<GetRefreshTokenDto>>(new GetRefreshTokenQuery());

        if (refreshTokenResult.success && refreshTokenResult.data!.expiresAt < new Date()) {
            this.tokens.refreshToken = refreshTokenResult.data!.refreshToken;

            this.refreshTokens(this.tokens.refreshToken);
        }
        else {
            this.generateTokensViaNonce();
        }

        this.startBackgroundTokenRefresh();
    }

    private async refreshTokens(refreshToken: string): Promise<void> {

        const result = await this.refreshTokenApi.handle({ userId: this.userId!, deviceId: this.deviceId!, refreshToken: refreshToken });

        if (result.success) {
            this.tokens.jwt = result.data!.jwt;
            this.tokens.expiresAt = result.data!.expiresAt;
        }
        else {
            console.error(result.errorMessage);
        }

    }

    private async generateTokensViaNonce(): Promise<void> {

    }

    private async startBackgroundTokenRefresh(): Promise<void> {

    }
}