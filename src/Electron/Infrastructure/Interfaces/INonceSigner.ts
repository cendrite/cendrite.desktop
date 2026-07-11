export interface INonceSigner {
    signNonce(nonce: string): Promise<string>;
}
