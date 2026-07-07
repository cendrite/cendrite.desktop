import { RefreshToken } from "../../../Domain/Entities/RefreshToken.js";
import { GetNonceApi } from "../../../Infrastructure/API/Identity/Auth/GetNonceApi.js";
import { RefreshTokenApi } from "../../../Infrastructure/API/Identity/Auth/RefreshTokenApi.js";
import { VerifyNonceApi } from "../../../Infrastructure/API/Identity/Auth/VerifyNonceApi.js";
import { RefreshTokenRepository } from "../../../Persistence/Repositories/RefreshTokenRepository.js";
import { NonceSigner } from "./NonceSigner.js";
import { Tokens } from "./Tokens.js";

export class TokenManager {
    private static instance: TokenManager;
    private userId: string | null = null;
    private deviceId: string | null = null;
    private tokens: Tokens;
    private stopRefreshLoop: boolean = false;
    private refreshInProgress: Promise<void> | null = null;
    private refreshLoopTimer: ReturnType<typeof setTimeout> | null = null;

    private readonly NonceSigner = new NonceSigner();
    private readonly refreshTokenApi = new RefreshTokenApi();
    private readonly getNonceApi = new GetNonceApi();
    private readonly verifyNonceApi = new VerifyNonceApi();
    private readonly refreshTokenRepo = new RefreshTokenRepository();

    private constructor() {
        this.tokens = {
            jwt: null,
            refreshToken: null,
            expiresAt: null,
        };
    }

    public static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }

    public getJwt(): string {
        if (this.tokens.jwt === null) {
            throw new Error('JWT token is null');
        }
        return this.tokens.jwt;
    }

    private setUserId(userId: string): void {
        this.userId = userId;
    }

    private setDeviceId(deviceId: string): void {
        this.deviceId = deviceId;
    }

    private setTokens(tokens: Tokens): void {
        this.tokens = tokens;
    }

    public async init(userId: string, deviceId: string): Promise<void> {
        this.stopRefreshLoop = false;
        this.setUserId(userId);
        this.setDeviceId(deviceId);
        console.log(`TokenManager initialized with userId: ${userId} and deviceId: ${deviceId}`);
        const refreshToken = await this.refreshTokenRepo.get();
        if (refreshToken) {
            this.tokens.refreshToken = refreshToken.token;
            await this.refreshTokens();

        } else {
            console.log('No refresh token found. Generating new nonce and refresh token.');
            await this.generateTokensViaNonce();
        }

        await this.startBackgroundTokenRefresh();
    }

    public async refreshTokens(): Promise<void> {
        if(this.stopRefreshLoop){
            console.log("Refresh loop stopped by request. Aborting.");
            return;
        }

        if (this.refreshInProgress) {
            console.log("Refresh in progress, waiting for it to finish");
            await this.refreshInProgress;
            return;
        }

        this.refreshInProgress = this.refreshTokensInternal();

        try{
            await this.refreshInProgress;
        }
        finally{
            this.refreshInProgress = null;
        }
    }

    private async refreshTokensInternal(): Promise<void> {
        if (this.tokens.refreshToken === null) {
            console.log('Refresh token is null, generating new tokens via nonce');
            await this.generateTokensViaNonce();
            return;
        }

        const rtResponse = await this.refreshTokenApi.refreshToken({
            userId: this.userId!,
            deviceId: this.deviceId!,
            refreshToken: this.tokens.refreshToken,
        });

        if (!rtResponse.success) {
            console.error('Failed to refresh tokens:', rtResponse.errorMessage);
            await this.generateTokensViaNonce();
            return;
        }

        this.setTokens({
            jwt: rtResponse.data!.jwt,
            refreshToken: rtResponse.data!.refreshToken,
            expiresAt: rtResponse.data!.expiresAt,
        });

        await this.refreshTokenRepo.create(new RefreshToken(rtResponse.data!.refreshToken, rtResponse.data!.expiresAt));
    }

    private async generateTokensViaNonce(): Promise<void> {
        if (!this.userId || !this.deviceId) {
            throw new Error('UserId or DeviceId is not set. Cannot generate tokens.');
        }

        const nonceResponse = await this.getNonceApi.getNonce({
            UserId: this.userId,
            DeviceId: this.deviceId,
        });

        if (!nonceResponse.success) {
            throw new Error(`Failed to get nonce: ${nonceResponse.errorMessage}`);
        }

        const signedNonce = await this.NonceSigner.signNonce(nonceResponse.data!.nonceValue);

        const verifyResponse = await this.verifyNonceApi.verifyNonce({
            userId: this.userId,
            deviceId: this.deviceId,
            nonceId: nonceResponse.data!.nonceId,
            nonce: signedNonce,
        });

        if (!verifyResponse.success) {
            throw new Error(`Failed to verify nonce: ${verifyResponse.errorMessage}`);
        }

        this.setTokens({
            jwt: verifyResponse.data!.jwt,
            refreshToken: verifyResponse.data!.refreshToken,
            expiresAt: verifyResponse.data!.expiresAt,
        });

        await this.refreshTokenRepo.create(
            new RefreshToken(verifyResponse.data!.refreshToken, verifyResponse.data!.expiresAt),
        );
    }

    private async startBackgroundTokenRefresh(): Promise<void> {
        const REFRESH_INTERVAL = 1000 * 60 * 10; // 10 minutes
        let isFirstRun = true;

        if (this.stopRefreshLoop) {
            console.log('Refresh loop stopped by request. Aborting.');
            return;
        }

        const refreshLoop = async () => {
            if (isFirstRun) {
                console.log('Skipping first refresh loop');
                isFirstRun = false;
                setTimeout(refreshLoop, REFRESH_INTERVAL);
                return;
            }

            if (this.tokens.refreshToken === null) {
                console.warn('how the fuck is the token null?');
                return;
            }
            await this.refreshTokens();

            this.refreshLoopTimer = setTimeout(refreshLoop, REFRESH_INTERVAL);
        };
        await refreshLoop();
    }

    public disableAndClear(): void {
        this.stopRefreshLoop = true;

        if (this.refreshLoopTimer) {
            clearTimeout(this.refreshLoopTimer);
            this.refreshLoopTimer = null;
        }

        this.userId = null;
        this.deviceId = null;
        this.tokens = {
            jwt: null,
            refreshToken: null,
            expiresAt: null,
        };
    }
}
