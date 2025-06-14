export class CreateDeviceCommand implements MediatorRequest {
    public type = "CreateDeviceRequest";
    public id: string;
    public connectionId: string;
    public publicKey: string;
    public privateKey: string;

    constructor(
        id: string,
        connectionId: string,
        publicKey: string,
        privateKey: string) {
        this.id = id;
        this.connectionId = connectionId;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}
