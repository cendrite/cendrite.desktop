import { ITokenIssuerKeyProvider } from '#electron/Application/Contracts/Services/ITokenIssuerKeyProvider';

export class PinnedTokenIssuerKey implements ITokenIssuerKeyProvider {
    constructor(private readonly encodedPublicKey: string) { }

    public getPublicKey(): Promise<Uint8Array> {
        if (!this.encodedPublicKey) {
            return Promise.reject(new Error('No token issuer public key is pinned in this build'));
        }

        return Promise.resolve(new Uint8Array(Buffer.from(this.encodedPublicKey, 'base64url')));
    }
}
