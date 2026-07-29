export interface PreKeyBundle {
    identityKey: string;
    registrationId: number;
    signedPrekeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    preKey: { keyId: number; publicKey: string } | null;
}

export class KeyPair {
    public publicKey: Buffer;
    public privateKey: Buffer;

    constructor(publicKey: Buffer, privateKey: Buffer) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}
