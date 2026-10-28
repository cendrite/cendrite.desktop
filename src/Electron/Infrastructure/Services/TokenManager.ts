import { ITokenProvider } from '#electron/Application/Contracts/Providers/ITokenProvider';
import { BrowserWindow } from 'electron';
import { DEVICE_REVOKED_CODE, DeviceRevokedError, ITokenManager } from '#electron/Application/Contracts/Services/ITokenManager';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import {
    IBlindTokenService,
    LEDGER_TOKEN_ORIGIN,
    TokenIssuance,
} from '#electron/Application/Contracts/Services/IBlindTokenService';
import { IPrivateTokenRepository } from '#electron/Application/Contracts/Repositories/IPrivateTokenRepository';
import { NonceSigner } from './NonceSigner.js';

const PRIVATE_TOKEN_WALLET_SIZE = 3;

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
    private readonly blindTokenService: IBlindTokenService;
    private readonly privateTokenRepository: IPrivateTokenRepository;
    private readonly mainWindow: BrowserWindow;

    public constructor(
        tokenProvider: ITokenProvider,
        nonceSigner: NonceSigner,
        blindTokenService: IBlindTokenService,
        privateTokenRepository: IPrivateTokenRepository,
        mainWindow: BrowserWindow,
    ) {
        this.tokenProvider = tokenProvider;
        this.nonceSigner = nonceSigner;
        this.blindTokenService = blindTokenService;
        this.privateTokenRepository = privateTokenRepository;
        this.mainWindow = mainWindow;
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
        const issuance = await this.createTokenIssuance();

        const verifyResponse = await this.tokenProvider.verifyNonce({
            userId: this.userId,
            deviceId: this.deviceId,
            nonceId: nonceResponse.data.nonceId,
            nonce: signedNonce,
            announce,
            tokenRequests: issuance?.tokenRequests ?? [],
        });

        if (!verifyResponse.success) {
            if (verifyResponse.errorMessage.errorCode === DEVICE_REVOKED_CODE) throw new DeviceRevokedError();
            throw new Error(`Failed to verify nonce: ${verifyResponse.errorMessage.message}`);
        }

        this.setTokens({
            jwt: verifyResponse.data.jwt,
            expiresAt: verifyResponse.data.expiresAt,
        });

        if (issuance) await this.storePrivateTokens(issuance, verifyResponse.data.tokenResponses ?? []);
    }

    private async createTokenIssuance(): Promise<TokenIssuance | null> {
        try {
            const missing = PRIVATE_TOKEN_WALLET_SIZE - (await this.privateTokenRepository.count(LEDGER_TOKEN_ORIGIN));
            if (missing <= 0) return null;

            return await this.blindTokenService.createTokenRequests(LEDGER_TOKEN_ORIGIN, missing);
        } catch (error) {
            console.error('Could not create private token requests:', error);
            return null;
        }
    }

    private async storePrivateTokens(issuance: TokenIssuance, tokenResponses: string[]): Promise<void> {
        if (tokenResponses.length === 0) return;

        try {
            const tokens = await this.blindTokenService.finalize(issuance, tokenResponses);
            await this.privateTokenRepository.store(issuance.origin, tokens);
        } catch (error) {
            console.error('Could not finalize private tokens:', error);
        }
    }

    private async startBackgroundTokenRefresh(): Promise<void> {
        const REFRESH_INTERVAL = 1000 * 60 * 10; // 10 minutes
        const REFRESH_RETRY_INTERVAL = 1000 * 30; // 30 seconds
        let isFirstRun = true;

        if (this.stopRefreshLoop) {
            console.log('Refresh loop stopped by request. Aborting.');
            return;
        }

        const refreshLoop = async () => {
            if (isFirstRun) {
                console.log('Skipping first refresh loop');
                isFirstRun = false;
                this.refreshLoopTimer = setTimeout(refreshLoop, REFRESH_INTERVAL);
                return;
            }

            if (this.stopRefreshLoop) {
                return;
            }
            try {
                await this.refreshTokens();
            } catch (error) {
                if (error instanceof DeviceRevokedError) {
                    console.warn('Device has been revoked. Stopping token refresh.');
                    this.stopRefreshLoop = true;
                    this.mainWindow.webContents.send('connectionState', 'revoked');
                    return;
                }

                console.error('Token refresh failed, retrying:', error);
                this.refreshLoopTimer = setTimeout(refreshLoop, REFRESH_RETRY_INTERVAL);
                return;
            }

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
