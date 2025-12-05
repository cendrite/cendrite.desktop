export class KeyPairDto {
    public publicKey: Buffer;
    public privateKey: Buffer;

    constructor(publicKey: Buffer, privateKey: Buffer) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}
