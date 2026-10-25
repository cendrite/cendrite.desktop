export interface ITokenIssuerKeyProvider {
    getPublicKey(): Promise<Uint8Array>;
}
