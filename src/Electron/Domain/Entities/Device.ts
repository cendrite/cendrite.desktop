export class Device {
    id!: string;
    privateKey!: string;
    publicKey!: string;

    constructor(id: string, privateKey: string, publicKey: string) {
        this.id = id;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }
}