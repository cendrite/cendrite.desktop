import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TokenManager } from '../../../../../src/Electron/Infrastructure/Services/TokenManager.js';
import { NonceSigner } from '../../../../../src/Electron/Infrastructure/Services/NonceSigner.js';
import {
    ITokenProvider,
    VerifyNonceRequest,
    VerifyNonceResponse,
} from '../../../../../src/Electron/Application/Contracts/Providers/ITokenProvider.js';
import {
    IBlindTokenService,
    TokenIssuance,
} from '../../../../../src/Electron/Application/Contracts/Services/IBlindTokenService.js';
import { IPrivateTokenRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IPrivateTokenRepository.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';
import { DeviceRevokedError } from '../../../../../src/Electron/Application/Contracts/Services/ITokenManager.js';
import { BrowserWindow } from 'electron';

const nonceSigner = { signNonce: async () => 'signed-nonce' } as unknown as NonceSigner;

class FakeTokenProvider implements ITokenProvider {
    public verified: VerifyNonceRequest[] = [];
    public tokenResponses: string[] | undefined = [];
    public verifyError: ErrorMessage | null = null;

    public async getNonce() {
        return Result.success({ nonceId: 'nonce-id', deviceId: 'device-1', nonceValue: 'nonce' });
    }

    public async verifyNonce(req: VerifyNonceRequest) {
        this.verified.push(req);
        if (this.verifyError) return Result.fail<VerifyNonceResponse>(this.verifyError);
        return Result.success<VerifyNonceResponse>({ jwt: 'jwt', expiresAt: '2026-10-25T10:00:00Z', tokenResponses: this.tokenResponses });
    }
}

class FakeBlindTokenService implements IBlindTokenService {
    public failCreate = false;
    public failFinalize = false;

    public async createTokenRequests(origin: string, count: number): Promise<TokenIssuance> {
        if (this.failCreate) throw new Error('no issuer key');
        return { origin, tokenRequests: Array.from({ length: count }, (_, i) => `request-${i}`) };
    }

    public async finalize(_issuance: TokenIssuance, tokenResponses: string[]): Promise<Buffer[]> {
        if (this.failFinalize) throw new Error('bad signature');
        return tokenResponses.map((response) => Buffer.from(`token-for-${response}`));
    }
}

class FakeWallet implements IPrivateTokenRepository {
    public stored: { origin: string; tokens: Buffer[] }[] = [];

    constructor(public held = 0) { }

    public async store(origin: string, tokens: Buffer[]) {
        this.stored.push({ origin, tokens });
    }

    public async count() {
        return this.held;
    }

    public async take() {
        return null;
    }

    public async deleteAll() { }
}

let provider: FakeTokenProvider;
let blindTokens: FakeBlindTokenService;
let sent: unknown[][];
let mainWindow: BrowserWindow;

beforeEach(() => {
    vi.useFakeTimers();
    provider = new FakeTokenProvider();
    blindTokens = new FakeBlindTokenService();
    sent = [];
    mainWindow = { webContents: { send: (...args: unknown[]) => sent.push(args) } } as unknown as BrowserWindow;
});

afterEach(() => {
    vi.useRealTimers();
});

async function signIn(wallet: FakeWallet): Promise<TokenManager> {
    const sut = new TokenManager(provider, nonceSigner, blindTokens, wallet, mainWindow);
    await sut.init('user-1', 'device-1');
    sut.disableAndClear();
    return sut;
}

describe('topping up the private token wallet', () => {
    test('requests enough tokens to fill an empty wallet', async () => {
        await signIn(new FakeWallet(0));

        expect(provider.verified[0].tokenRequests).toEqual(['request-0', 'request-1', 'request-2']);
    });

    test('requests only the tokens that are missing', async () => {
        await signIn(new FakeWallet(1));

        expect(provider.verified[0].tokenRequests).toHaveLength(2);
    });

    test('requests nothing when the wallet is full', async () => {
        await signIn(new FakeWallet(3));

        expect(provider.verified[0].tokenRequests).toEqual([]);
    });

    test('finalizes the token responses and stores the tokens for the ledger', async () => {
        provider.tokenResponses = ['response-0', 'response-1', 'response-2'];
        const wallet = new FakeWallet(0);

        await signIn(wallet);

        expect(wallet.stored).toHaveLength(1);
        expect(wallet.stored[0].origin).toBe('ledger');
        expect(wallet.stored[0].tokens.map((token) => token.toString())).toEqual([
            'token-for-response-0',
            'token-for-response-1',
            'token-for-response-2',
        ]);
    });

    test('stores nothing when the issuer sent no token responses', async () => {
        provider.tokenResponses = [];
        const wallet = new FakeWallet(0);

        await signIn(wallet);

        expect(wallet.stored).toEqual([]);
    });

    test('stores nothing when the issuer does not know about tokens', async () => {
        provider.tokenResponses = undefined;
        const wallet = new FakeWallet(0);

        await signIn(wallet);

        expect(wallet.stored).toEqual([]);
    });
});

describe('the JWT never depends on private tokens', () => {
    test('still signs in when token requests cannot be created', async () => {
        blindTokens.failCreate = true;

        const sut = new TokenManager(provider, nonceSigner, blindTokens, new FakeWallet(0), mainWindow);
        await sut.init('user-1', 'device-1');

        expect(provider.verified[0].tokenRequests).toEqual([]);
        expect(sut.getJwt()).toBe('jwt');
        sut.disableAndClear();
    });

    test('still signs in when the token responses cannot be finalized', async () => {
        provider.tokenResponses = ['response-0'];
        blindTokens.failFinalize = true;
        const wallet = new FakeWallet(2);

        const sut = new TokenManager(provider, nonceSigner, blindTokens, wallet, mainWindow);
        await sut.init('user-1', 'device-1');

        expect(sut.getJwt()).toBe('jwt');
        expect(wallet.stored).toEqual([]);
        sut.disableAndClear();
    });
});

describe('revoked devices', () => {
    const revoked = () => new ErrorMessage('Forbidden', 'This device has been removed from the account.', 'device.revoked');

    test('init throws DeviceRevokedError when the device has been revoked', async () => {
        provider.verifyError = revoked();
        const sut = new TokenManager(provider, nonceSigner, blindTokens, new FakeWallet(3), mainWindow);

        await expect(sut.init('user-1', 'device-1')).rejects.toBeInstanceOf(DeviceRevokedError);
        sut.disableAndClear();
    });

    test('init throws a plain error for other verification failures', async () => {
        provider.verifyError = new ErrorMessage('Unauthorized', 'Unauthorized');
        const sut = new TokenManager(provider, nonceSigner, blindTokens, new FakeWallet(3), mainWindow);

        const error = await sut.init('user-1', 'device-1').catch((e: unknown) => e);

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(DeviceRevokedError);
        sut.disableAndClear();
    });

    test('a failed refresh keeps the loop alive and retries without reporting a revocation', async () => {
        const sut = new TokenManager(provider, nonceSigner, blindTokens, new FakeWallet(3), mainWindow);
        await sut.init('user-1', 'device-1');

        provider.verifyError = new ErrorMessage('ApiError', 'An unexpected error occurred.');
        await vi.advanceTimersByTimeAsync(1000 * 60 * 10);

        expect(provider.verified).toHaveLength(2);
        expect(sent).not.toContainEqual(['connectionState', 'revoked']);

        provider.verifyError = null;
        await vi.advanceTimersByTimeAsync(1000 * 30);

        expect(provider.verified).toHaveLength(3);
        expect(sut.getJwt()).toBe('jwt');
        expect(sent).not.toContainEqual(['connectionState', 'revoked']);
        sut.disableAndClear();
    });

    test('the refresh loop reports a revoked device to the renderer', async () => {
        const sut = new TokenManager(provider, nonceSigner, blindTokens, new FakeWallet(3), mainWindow);
        await sut.init('user-1', 'device-1');

        provider.verifyError = revoked();
        await vi.advanceTimersByTimeAsync(1000 * 60 * 10);

        expect(sent).toContainEqual(['connectionState', 'revoked']);
        sut.disableAndClear();
    });
});

describe('the refresh loop', () => {
    test('signing out cancels the pending refresh so signing in again runs a single loop', async () => {
        const sut = new TokenManager(provider, nonceSigner, blindTokens, new FakeWallet(3), mainWindow);
        await sut.init('user-1', 'device-1');

        await vi.advanceTimersByTimeAsync(1000 * 60 * 5);
        sut.disableAndClear();
        await sut.init('user-1', 'device-1');

        await vi.advanceTimersByTimeAsync(1000 * 60 * 5);
        expect(provider.verified).toHaveLength(2);

        await vi.advanceTimersByTimeAsync(1000 * 60 * 5);
        expect(provider.verified).toHaveLength(3);
        sut.disableAndClear();
    });
});
