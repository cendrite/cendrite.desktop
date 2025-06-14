export class Device {
    id: string;
    connectionId: string;
    privateKey: string;
    publicKey: string;

    constructor(id: string, connectionId: string, privateKey: string, publicKey: string) {
        this.id = id;
        this.connectionId = connectionId;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }
}