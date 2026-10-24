import { publicVerif, TOKEN_TYPES, TokenChallenge } from '@cloudflare/privacypass-ts';
import { IBlindTokenService, TokenIssuance } from '#electron/Application/Contracts/Services/IBlindTokenService';

export const BLIND_TOKEN_ISSUER = 'identity.cypherly';

class PendingTokenIssuance implements TokenIssuance {
    constructor(
        public readonly origin: string,
        public readonly tokenRequests: string[],
        public readonly clients: publicVerif.Client[],
    ) { }
}

export class BlindTokenService implements IBlindTokenService {
    constructor(private readonly issuerPublicKey: Uint8Array) { }

    public async createTokenRequests(origin: string, count: number): Promise<TokenIssuance> {
        const challenge = new TokenChallenge(TOKEN_TYPES.BLIND_RSA.value, BLIND_TOKEN_ISSUER, new Uint8Array(0), [origin]);

        const clients: publicVerif.Client[] = [];
        const tokenRequests: string[] = [];

        for (let i = 0; i < count; i++) {
            const client = new publicVerif.Client(publicVerif.BlindRSAMode.PSS);
            const tokenRequest = await client.createTokenRequest(challenge, this.issuerPublicKey);

            clients.push(client);
            tokenRequests.push(Buffer.from(tokenRequest.serialize()).toString('base64'));
        }

        return new PendingTokenIssuance(origin, tokenRequests, clients);
    }

    public async finalize(issuance: TokenIssuance, tokenResponses: string[]): Promise<Buffer[]> {
        if (!(issuance instanceof PendingTokenIssuance)) throw new Error('Issuance was not created by this service');
        if (tokenResponses.length !== issuance.clients.length) throw new Error('Expected one token response per token request');

        const tokens: Buffer[] = [];

        for (const [index, client] of issuance.clients.entries()) {
            const tokenResponse = client.deserializeTokenResponse(fromBase64(tokenResponses[index]));
            const token = await client.finalize(tokenResponse);
            tokens.push(Buffer.from(token.serialize()));
        }

        return tokens;
    }
}

function fromBase64(value: string): Uint8Array {
    return new Uint8Array(Buffer.from(value, 'base64'));
}
