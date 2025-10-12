export class SignedPreKeyDto {
    keyId: number;
    publicKey: string;
    signature: string;
    timestamp: Date;

    constructor(keyId: number, publicKey: string, signature: string, timestamp: Date) {
        this.keyId = keyId;
        this.publicKey = publicKey;
        this.signature = signature;
        this.timestamp = timestamp;
    }
}
