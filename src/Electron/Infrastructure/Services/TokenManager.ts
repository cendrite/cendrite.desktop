import { ITokenProvider } from '#electron/Application/Contracts/Providers/ITokenProvider';
import { ITokenManager } from '#electron/Application/Contracts/Services/ITokenManager';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { NonceSigner } from './NonceSigner.js';

export interface Tokens {
    jwt: string | null;
    expiresAt: string | null;
}

export class TokenManager implements ITokenManager {
    private userId: string | null = null;
    private deviceId: string | null = null;
    private tokens: Tokens;
    private stopRefreshLoop: boolean = false;
    private refreshInProgress: Promise<void> | null = null;
    private refreshLoopTimer: ReturnType<typeof setTimeout> | null = null;

    private readonly tokenProvider: ITokenProvider;
    private readonly nonceSigner: INonceSigner;

    public constructor(
        tokenProvider: ITokenProvider,
        nonceSigner: NonceSigner,
    ) {
        this.tokenProvider = tokenProvider;
        this.nonceSigner = nonceSigner;
        this.tokens = {
            jwt: null,
            expiresAt: null,
        };
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
        await this.generateTokensViaNonce(true);

        await this.startBackgroundTokenRefresh();
    }

    public async refreshTokens(): Promise<void> {
        if (this.stopRefreshLoop) {
            console.log('Refresh loop stopped by request. Aborting.');
            return;
        }

        if (this.refreshInProgress) {
            console.log('Refresh in progress, waiting for it to finish');
            await this.refreshInProgress;
            return;
        }

        this.refreshInProgress = this.refreshTokensInternal();

        try {
            await this.refreshInProgress;
        } finally {
            this.refreshInProgress = null;
        }
    }

    private async refreshTokensInternal(): Promise<void> {
        await this.generateTokensViaNonce(false);
    }

    private async generateTokensViaNonce(announce: boolean): Promise<void> {
        if (!this.userId || !this.deviceId) {
            throw new Error('UserId or DeviceId is not set. Cannot generate tokens.');
        }

        const nonceResponse = await this.tokenProvider.getNonce({
            userId: this.userId,
            deviceId: this.deviceId,
        });

        if (!nonceResponse.success) {
            throw new Error(`Failed to get nonce: ${nonceResponse.errorMessage.message}`);
        }

        const signedNonce = await this.nonceSigner.signNonce(nonceResponse.data.nonceValue);

        const verifyResponse = await this.tokenProvider.verifyNonce({
            userId: this.userId,
            deviceId: this.deviceId,
            nonceId: nonceResponse.data.nonceId,
            nonce: signedNonce,
            announce,
        });

        if (!verifyResponse.success) {
            throw new Error(`Failed to verify nonce: ${verifyResponse.errorMessage.message}`);
        }

        this.setTokens({
            jwt: verifyResponse.data.jwt,
            expiresAt: verifyResponse.data.expiresAt,
        });
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

            if (this.stopRefreshLoop) {
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
            expiresAt: null,
        };
    }
}
