export class CreateDeviceRequest implements MediatorRequest {
    public type = "CreateDeviceRequest";
    public id: string;
    public publicKey: string;
    public privateKey: string;

    constructor(id: string, publicKey: string, privateKey: string) {
        this.id = id;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}
