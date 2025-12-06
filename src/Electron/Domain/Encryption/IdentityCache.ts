export class IdentityCache {
    encodedAddress: string;
    identityKeyPublic: Buffer;
    trusted: boolean;
    timestamp: number;

    constructor(connectionId: string, identityKeyPublic: Buffer, trusted: boolean, timestamp: number) {
        this.encodedAddress = connectionId;
        this.identityKeyPublic = identityKeyPublic;
        this.trusted = trusted;
        this.timestamp = timestamp;
    }
}
