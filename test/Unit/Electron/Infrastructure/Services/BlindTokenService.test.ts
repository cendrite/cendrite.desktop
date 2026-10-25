import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, test } from 'vitest';
import { publicVerif, Token, TOKEN_TYPES, TokenChallenge } from '@cloudflare/privacypass-ts';
import {
    BLIND_TOKEN_ISSUER,
    BlindTokenService,
} from '../../../../../src/Electron/Infrastructure/Services/BlindTokenService.js';

const { BlindRSAMode, Issuer, Origin, TokenRequest, getPublicKeyBytes } = publicVerif;

let keys: CryptoKeyPair;
let issuer: InstanceType<typeof Issuer>;
let sut: BlindTokenService;

beforeAll(async () => {
    keys = await Issuer.generateKey(BlindRSAMode.PSS, { modulusLength: 2048, publicExponent: Uint8Array.from([1, 0, 1]) });
    issuer = new Issuer(BlindRSAMode.PSS, BLIND_TOKEN_ISSUER, keys.privateKey, keys.publicKey);
    const issuerPublicKey = await getPublicKeyBytes(keys.publicKey);
    sut = new BlindTokenService({ getPublicKey: async () => issuerPublicKey });
});

function own(bytes: Uint8Array): Uint8Array {
    return new Uint8Array(bytes);
}

async function issue(tokenRequests: string[]): Promise<string[]> {
    return Promise.all(
        tokenRequests.map(async (encoded) => {
            const tokenRequest = TokenRequest.deserialize(TOKEN_TYPES.BLIND_RSA, own(Buffer.from(encoded, 'base64')));
            const tokenResponse = await issuer.issue(tokenRequest);
            return Buffer.from(tokenResponse.serialize()).toString('base64');
        }),
    );
}

describe('createTokenRequests', () => {
    test('creates one 259-byte token request per token', async () => {
        const issuance = await sut.createTokenRequests('ledger', 3);

        expect(issuance.origin).toBe('ledger');
        expect(issuance.tokenRequests).toHaveLength(3);
        expect(issuance.tokenRequests.map((request) => Buffer.from(request, 'base64').length)).toEqual([259, 259, 259]);
    });

    test('blinds every token request differently', async () => {
        const issuance = await sut.createTokenRequests('ledger', 2);

        expect(issuance.tokenRequests[0]).not.toBe(issuance.tokenRequests[1]);
    });
});

describe('finalize', () => {
    test('finalizes the token responses into tokens the issuer key verifies', async () => {
        const issuance = await sut.createTokenRequests('ledger', 3);

        const tokens = await sut.finalize(issuance, await issue(issuance.tokenRequests));

        const origin = new Origin(BlindRSAMode.PSS, ['ledger']);
        expect(tokens.map((token) => token.length)).toEqual([354, 354, 354]);
        for (const token of tokens) {
            expect(await origin.verify(Token.deserialize(TOKEN_TYPES.BLIND_RSA, own(token)), keys.publicKey)).toBe(true);
        }
    });

    test('binds each token to the challenge for its origin', async () => {
        const issuance = await sut.createTokenRequests('ledger', 1);
        const [token] = await sut.finalize(issuance, await issue(issuance.tokenRequests));

        const challenge = new TokenChallenge(TOKEN_TYPES.BLIND_RSA.value, BLIND_TOKEN_ISSUER, new Uint8Array(0), ['ledger']);
        const other = new TokenChallenge(TOKEN_TYPES.BLIND_RSA.value, BLIND_TOKEN_ISSUER, new Uint8Array(0), ['keystore']);
        const digest = Buffer.from(Token.deserialize(TOKEN_TYPES.BLIND_RSA, own(token)).authInput.challengeDigest);

        expect(digest).toEqual(createHash('sha256').update(challenge.serialize()).digest());
        expect(digest).not.toEqual(createHash('sha256').update(other.serialize()).digest());
    });

    test('rejects token responses in the wrong order', async () => {
        const issuance = await sut.createTokenRequests('ledger', 2);
        const [first, second] = await issue(issuance.tokenRequests);

        await expect(sut.finalize(issuance, [second, first])).rejects.toThrow();
    });

    test('rejects a token response count that does not match the token requests', async () => {
        const issuance = await sut.createTokenRequests('ledger', 2);
        const tokenResponses = await issue(issuance.tokenRequests);

        await expect(sut.finalize(issuance, tokenResponses.slice(0, 1))).rejects.toThrow('Expected one token response per token request');
    });

    test('rejects an issuance it did not create', async () => {
        await expect(sut.finalize({ origin: 'ledger', tokenRequests: [] }, [])).rejects.toThrow('Issuance was not created by this service');
    });
});
