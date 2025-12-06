export class EcPreKey {
    public readonly id: number;
    public readonly privateKey: Buffer;
    public readonly publicKey: Buffer;
    public readonly consumed!: boolean;

    constructor(id: number, privateKey: Buffer, publicKey: Buffer) {
        this.id = id;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }
}
