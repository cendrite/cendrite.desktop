export class EcPreKey {
    public readonly id!: number;
    public readonly privateKey: Buffer;
    public readonly publicKey: Buffer;
    public readonly consumed!: boolean;

    constructor(privateKey: Buffer, publicKey: Buffer) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }
}
