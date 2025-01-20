import { Tokens } from "./Tokens";
import { GetRefreshTokenDto } from './../../../Electron/Application/Features/RefreshToken/Queries/GetRefreshTokenDto';
import { GetRefreshTokenQuery } from './../../../Electron/Application/Features/RefreshToken/Queries/GetRefreshTokenQuery';
import { Result } from "../../../Shared/Result/Result";
import { RefreshTokenApi } from "./Api/TokenApi.ts/RefreshTokenApi";
import { GetNonceApi } from "./Api/Nonce/GetNonceApi";
import { VerifyNonceApi } from "./Api/Nonce/VerifyNonceApi";
import { SignNonceDto } from "../../../Electron/Application/Features/Device/Commands/SignNonce/SignNonceDto";
import { SignNonceRequest } from "../../../Electron/Application/Features/Device/Commands/SignNonce/SignNonceRequest";

export class TokenManager {
    private static instance: TokenManager;
    private userId: string | null = null;
    private deviceId: string | null = null;
    private tokens: Tokens;
    private readonly refreshTokenApi = new RefreshTokenApi();
    private readonly getNonceApi = new GetNonceApi();
    private readonly verifyNonceApi = new VerifyNonceApi();

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
        console.log("Setting user id", userId);
        this.userId = userId;
    }

    public setDeviceId(deviceId: string): void {
        console.log("Setting device id", deviceId);
        this.deviceId = deviceId;
    }

    public getTokens(): Tokens {
        return this.tokens;
    }

    public async initializeTokens(): Promise<void> {
        console.log("Initializing tokens");
        const refreshTokenResult = await window.electron.sendRequestAsync<Result<GetRefreshTokenDto>>(new GetRefreshTokenQuery());

        if (refreshTokenResult.success && refreshTokenResult.data!.expiresAt < new Date()) {
            this.tokens.refreshToken = refreshTokenResult.data!.refreshToken;

            console.log("Refreshing tokens via refresh token");
            await this.refreshTokens();
        }
        else {
            await this.generateTokensViaNonce();
        }

        console.log("Starting background token refresh");
        await this.startBackgroundTokenRefresh();
    }

    private async refreshTokens(): Promise<void> {

        console.log("Refreshing tokens");

        if (this.tokens.refreshToken === null) {
            console.error("Refresh token is null, generating tokens via nonce");
            await this.generateTokensViaNonce();
            return;
        }
        const result = await this.refreshTokenApi.handle({ userId: this.userId!, deviceId: this.deviceId!, refreshToken: this.tokens.refreshToken });

        if (result.errorMessage?.message.includes("Invalid refresh token")) {
            console.log("Invalid refresh token, generating tokens via nonce");
            await this.generateTokensViaNonce();
            return;
        }

        if (result.success) {
            console.log("Tokens refreshed successfully");
            console.log("New tokens: ", result.data);
            this.tokens.jwt = result.data!.jwt;
            this.tokens.refreshToken = result.data!.refreshToken;
            this.tokens.expiresAt = new Date(result.data!.expiresAt);
        }
        else {
            console.error(result.errorMessage);
        }
    }

    private async generateTokensViaNonce(): Promise<void> {
        console.log("Generating tokens via nonce");

        try {
            // Step 1: Fetch nonce
            const nonceResult = await this.getNonceApi.handle({ UserId: this.userId!, DeviceId: this.deviceId! });

            if (!nonceResult.success || !nonceResult.data) {
                throw new Error("Failed to fetch nonce: " + (nonceResult.errorMessage?.message || "Unknown error"));
            }

            // Step 2: Sign nonce
            const signedNonceResult = await window.electron.sendRequestAsync<Result<SignNonceDto>>(
                new SignNonceRequest(nonceResult.data.nonceValue)
            );

            if (!signedNonceResult.success || !signedNonceResult.data) {
                throw new Error("Failed to sign nonce: " + (signedNonceResult.errorMessage?.message || "Unknown error"));
            }

            // Step 3: Verify nonce
            const verifyNonceResult = await this.verifyNonceApi.handle({
                userId: this.userId!,
                deviceId: this.deviceId!,
                nonceId: nonceResult.data.nonceId,
                nonce: signedNonceResult.data.signature,
            });

            if (!verifyNonceResult.success || !verifyNonceResult.data) {
                throw new Error(
                    "Failed to verify nonce: " + (verifyNonceResult.errorMessage?.message || "Unknown error")
                );
            }

            // Step 4: Save tokens
            this.tokens.jwt = verifyNonceResult.data.jwt;
            this.tokens.refreshToken = verifyNonceResult.data.refreshToken;
            this.tokens.expiresAt = new Date(verifyNonceResult.data.expiresAt);

            console.log("Tokens generated successfully:", this.tokens);
        } catch (error) {
            console.error("Error generating tokens via nonce:", error);
            throw new Error("Failed to generate tokens via nonce.");
        }
    }

    private async startBackgroundTokenRefresh(): Promise<void> {
        const REFRESH_INTERVAL = 1000 * 60 * 0.5; // 30 seconds

        const refreshLoop = async () => {
            if (this.tokens.refreshToken === null) {
                console.warn("how the fuck is the token null?")
                return;
            }

            await this.refreshTokens();

            setTimeout(refreshLoop, REFRESH_INTERVAL);
        }

        refreshLoop();
    }
}