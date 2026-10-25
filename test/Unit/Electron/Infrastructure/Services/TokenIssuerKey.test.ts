import { describe, expect, test, vi } from 'vitest';
import { AxiosRequestConfig } from 'axios';
import { PinnedTokenIssuerKey } from '../../../../../src/Electron/Infrastructure/Services/PinnedTokenIssuerKey.js';
import { FetchedTokenIssuerKey } from '../../../../../src/Electron/Infrastructure/Services/FetchedTokenIssuerKey.js';
import { ApiClient } from '../../../../../src/Electron/Infrastructure/Clients/Base/ApiClient.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';

const KEY = Buffer.from([0x30, 0x82, 0x01, 0x52, 0xfb, 0xff]);

function directory(...keys: { 'token-type': number; 'token-key': string }[]) {
    return { 'issuer-request-uri': '/api/identity/verify-nonce', 'token-keys': keys };
}

function fakeClient(...results: Result<unknown>[]) {
    const calls: AxiosRequestConfig[] = [];
    const client = {
        handleConduit: vi.fn((config: AxiosRequestConfig) => {
            calls.push(config);
            return Promise.resolve(results.shift());
        }),
    } as unknown as ApiClient;
    return { client, calls };
}

describe('PinnedTokenIssuerKey', () => {
    test('decodes the pinned base64url key', async () => {
        const key = await new PinnedTokenIssuerKey(KEY.toString('base64url')).getPublicKey();

        expect(Buffer.from(key)).toEqual(KEY);
    });

    test('returns a key the privacy pass library can read at offset zero', async () => {
        const key = await new PinnedTokenIssuerKey(KEY.toString('base64url')).getPublicKey();

        expect(key.byteOffset).toBe(0);
        expect(key.buffer.byteLength).toBe(KEY.length);
    });

    test('rejects when no key is pinned', async () => {
        await expect(new PinnedTokenIssuerKey('').getPublicKey()).rejects.toThrow('No token issuer public key is pinned');
    });
});

describe('FetchedTokenIssuerKey', () => {
    test('takes the blind RSA key from the issuer directory', async () => {
        const { client } = fakeClient(
            Result.success(directory({ 'token-type': 1, 'token-key': 'AAAA' }, { 'token-type': 2, 'token-key': KEY.toString('base64url') })),
        );

        const key = await new FetchedTokenIssuerKey(client).getPublicKey();

        expect(Buffer.from(key)).toEqual(KEY);
    });

    test('fetches the directory once and reuses the key', async () => {
        const { client, calls } = fakeClient(Result.success(directory({ 'token-type': 2, 'token-key': KEY.toString('base64url') })));
        const sut = new FetchedTokenIssuerKey(client);

        await sut.getPublicKey();
        await sut.getPublicKey();

        expect(calls).toHaveLength(1);
    });

    test('fetches again after a failure', async () => {
        const { client, calls } = fakeClient(
            Result.fail(new ErrorMessage('ApiError', 'Unavailable')),
            Result.success(directory({ 'token-type': 2, 'token-key': KEY.toString('base64url') })),
        );
        const sut = new FetchedTokenIssuerKey(client);

        await expect(sut.getPublicKey()).rejects.toThrow('Could not fetch the token issuer directory');
        const key = await sut.getPublicKey();

        expect(Buffer.from(key)).toEqual(KEY);
        expect(calls).toHaveLength(2);
    });

    test('rejects a directory without a blind RSA key', async () => {
        const { client } = fakeClient(Result.success(directory({ 'token-type': 1, 'token-key': 'AAAA' })));

        await expect(new FetchedTokenIssuerKey(client).getPublicKey()).rejects.toThrow('no blind RSA key');
    });
});
