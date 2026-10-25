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

const nonceSigner = { signNonce: async () => 'signed-nonce' } as unknown as NonceSigner;

class FakeTokenProvider implements ITokenProvider {
    public verified: VerifyNonceRequest[] = [];
    public tokenResponses: string[] | undefined = [];

    public async getNonce() {
        return Result.success({ nonceId: 'nonce-id', deviceId: 'device-1', nonceValue: 'nonce' });
    }

    public async verifyNonce(req: VerifyNonceRequest) {
        this.verified.push(req);
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

beforeEach(() => {
    vi.useFakeTimers();
    provider = new FakeTokenProvider();
    blindTokens = new FakeBlindTokenService();
});

afterEach(() => {
    vi.useRealTimers();
});

async function signIn(wallet: FakeWallet): Promise<TokenManager> {
    const sut = new TokenManager(provider, nonceSigner, blindTokens, wallet);
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

        const sut = new TokenManager(provider, nonceSigner, blindTokens, new FakeWallet(0));
        await sut.init('user-1', 'device-1');

        expect(provider.verified[0].tokenRequests).toEqual([]);
        expect(sut.getJwt()).toBe('jwt');
        sut.disableAndClear();
    });

    test('still signs in when the token responses cannot be finalized', async () => {
        provider.tokenResponses = ['response-0'];
        blindTokens.failFinalize = true;
        const wallet = new FakeWallet(2);

        const sut = new TokenManager(provider, nonceSigner, blindTokens, wallet);
        await sut.init('user-1', 'device-1');

        expect(sut.getJwt()).toBe('jwt');
        expect(wallet.stored).toEqual([]);
        sut.disableAndClear();
    });
});
