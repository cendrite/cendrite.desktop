import { ITokenIssuerKeyProvider } from '#electron/Application/Contracts/Services/ITokenIssuerKeyProvider';
import { ApiClient } from '../Clients/Base/ApiClient.js';

const BLIND_RSA_TOKEN_TYPE = 0x0002;

interface TokenIssuerDirectory {
    'token-keys': { 'token-type': number; 'token-key': string }[];
}

export class FetchedTokenIssuerKey implements ITokenIssuerKeyProvider {
    private publicKey: Promise<Uint8Array> | null = null;

    constructor(private readonly tokenIssuerApiClient: ApiClient) { }

    public getPublicKey(): Promise<Uint8Array> {
        this.publicKey ??= this.fetchPublicKey().catch((error: unknown) => {
            this.publicKey = null;
            throw error;
        });

        return this.publicKey;
    }

    private async fetchPublicKey(): Promise<Uint8Array> {
        const result = await this.tokenIssuerApiClient.handleConduit<TokenIssuerDirectory>({ method: 'GET' });
        if (!result.success) throw new Error(`Could not fetch the token issuer directory: ${result.errorMessage.message}`);

        const tokenKey = result.data['token-keys'].find((key) => key['token-type'] === BLIND_RSA_TOKEN_TYPE);
        if (!tokenKey) throw new Error('The token issuer directory has no blind RSA key');

        return new Uint8Array(Buffer.from(tokenKey['token-key'], 'base64url'));
    }
}
