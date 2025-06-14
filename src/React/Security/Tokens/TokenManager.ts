import { RefreshTokenApi } from "../../Common/Api/Identity/Auth/RefreshTokenApi";
import { Tokens } from "./Tokens"
import {GetNonceApi} from "../../Common/Api/Identity/Auth/GetNonceApi.ts";
import { VerifyNonceApi } from "../../Common/Api/Identity/Auth/VerifyNonceApi.ts";
import {GetRefreshTokenDto} from "../../../Electron/Application/Features/RefreshToken/Queries/GetRefreshTokenDto.ts";
import {
    GetRefreshTokenQuery
} from "../../../Electron/Application/Features/RefreshToken/Queries/GetRefreshTokenQuery.ts";
import {
    CreateRefreshTokenRequest
} from "../../../Electron/Application/Features/RefreshToken/Commands/Create/CreateRefreshTokenRequest.ts";
import {SignNonceDto} from "../../../Electron/Application/Features/Device/Commands/SignNonce/SignNonceDto.ts";
import {SignNonceRequest} from "../../../Electron/Application/Features/Device/Commands/SignNonce/SignNonceRequest.ts";
import {Result} from "../../../Shared/Result/Result.ts";

export class TokenManager {
    private static instance: TokenManager;
    private userId: string | null = null;
    private deviceId: string | null = null;
    private tokens: Tokens;
    private stopRefreshLoop: boolean = false;
    private refreshInProgress: Promise<void> | null = null;
    private refreshLoopTimer: ReturnType<typeof setTimeout> | null = null;

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
    public getJwt(): string {
        if(this.tokens.jwt === null) {
            throw new Error("JWT token is null");
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

    public async initialize(userId: string, deviceId: string): Promise<void> {
        this.stopRefreshLoop = false;
        this.setUserId(userId);
        this.setDeviceId(deviceId);
        console.log("Initializing tokens");
        const refreshTokenResult = await window.electron.sendRequestAsync<Result<GetRefreshTokenDto>>(new GetRefreshTokenQuery());
        console.log("Refresh token result:", refreshTokenResult);

        if (refreshTokenResult.success && refreshTokenResult.data!.expiresAt > new Date()) {
            this.tokens.refreshToken = refreshTokenResult.data!.refreshToken;
            await this.refreshTokens();
        }
        else {
            if(!refreshTokenResult.success) console.log("Failed to fetch refresh token:", refreshTokenResult.errorMessage);
            console.log(refreshTokenResult.errorMessage);
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

    private async refreshTokensInternal(): Promise<void>
    {
        if(this.tokens.refreshToken === null) {
            console.error("Refresh token is null, default to generating tokens via nonce");
            await this.generateTokensViaNonce();
            return;
        }

        const result = await this.refreshTokenApi.refreshToken({ userId: this.userId!, deviceId: this.deviceId!, refreshToken: this.tokens.refreshToken });

        if(!result.success) {
            console.log("Invalid refresh token, generating tokens via nonce");
            await this.generateTokensViaNonce();
            return;
        }else{
            console.log("New tokens: ", result.data);
            this.setTokens({ jwt: result.data!.jwt, refreshToken: result.data!.refreshToken, expiresAt: result.data!.expiresAt });
            const refreshTokenInsertResult = await window.electron.sendRequestAsync<Result>(new CreateRefreshTokenRequest(result.data!.refreshToken, result.data!.expiresAt));
            if(!refreshTokenInsertResult.success) {
                console.error("Failed to insert new refresh token:", refreshTokenInsertResult.errorMessage);
            }
        }
    }

    private async generateTokensViaNonce(): Promise<void> {
        console.log("Generating tokens via nonce");
        try {
            const nonceResult = await this.getNonceApi.getNonce({ UserId: this.userId!, DeviceId: this.deviceId! });

            if (!nonceResult.success) {
                throw new Error("Failed to fetch nonce: " + (nonceResult.errorMessage?.message || "Unknown error"));
            }

            const signedNonceResult = await window.electron.sendRequestAsync<Result<SignNonceDto>>(
                new SignNonceRequest(nonceResult.data!.nonceValue)
            );

            if (!signedNonceResult.success) {
                throw new Error("Failed to sign nonce: " + (signedNonceResult.errorMessage?.message || "Unknown error"));
            }

            const verifyNonceResult = await this.verifyNonceApi.verifyNonce({
                userId: this.userId!,
                deviceId: this.deviceId!,
                nonceId: nonceResult.data!.nonceId,
                nonce: signedNonceResult.data!.signature,
            });

            if (!verifyNonceResult.success) {
                throw new Error("Failed to verify nonce: " + (verifyNonceResult.errorMessage?.message || "Unknown error"));
            }

            this.setTokens({ jwt: verifyNonceResult.data!.jwt, refreshToken: verifyNonceResult.data!.refreshToken, expiresAt: verifyNonceResult.data!.expiresAt });
            const refreshTokenInsertResult = await window.electron.sendRequestAsync<Result>(new CreateRefreshTokenRequest(verifyNonceResult.data!.refreshToken, verifyNonceResult.data!.expiresAt));
            if (!refreshTokenInsertResult.success) {
                console.error("Failed to insert new refresh token:", refreshTokenInsertResult.errorMessage);
                //TODO: fatal
            }

            console.log("Tokens generated successfully:", this.tokens);
        } catch (error) {
            console.error("Error generating tokens via nonce:", error);
            throw new Error("Failed to generate tokens via nonce.");
        }
    }

    private async startBackgroundTokenRefresh(): Promise<void> {
        const REFRESH_INTERVAL = 1000 * 60 * 10; // 10 minutes
        let isFirstRun = true;

        if(this.stopRefreshLoop){
            console.log("Refresh loop stopped by request. Aborting.");
            return;
        }

        const refreshLoop = async () => {
            if(isFirstRun)
            {
                console.log("Skipping first refresh loop");
                isFirstRun = false;
                setTimeout(refreshLoop, REFRESH_INTERVAL);
                return;
            }

            if (this.tokens.refreshToken === null) {
                console.warn("how the fuck is the token null?")
                return;
            }
            await this.refreshTokens();

            this.refreshLoopTimer = setTimeout(refreshLoop, REFRESH_INTERVAL);
        }
        await refreshLoop();
    }

    public disableAndClear(): void {
        console.log("Disabling TokenManager and clearing data.")
        this.stopRefreshLoop = true;

        if(this.refreshLoopTimer){
            clearTimeout(this.refreshLoopTimer)
            this.refreshLoopTimer = null;
        }

        this.userId = null;
        this.deviceId = null;
        this.tokens = {
            jwt: null,
            refreshToken: null,
            expiresAt: null
        }
    }
}