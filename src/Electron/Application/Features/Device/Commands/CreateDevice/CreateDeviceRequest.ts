export class CreateDeviceRequest implements MediatorRequest {
    public type = "CreateDeviceRequest";
    private _id: string;
    private _publicKey: string;
    private _privateKey: string;

    constructor(id: string, publicKey: string, privateKey: string) {
        this._id = id;
        this._publicKey = publicKey;
        this._privateKey = privateKey;
    }

    public get id(): string {
        return this._id;
    }

    public get publicKey(): string {
        return this._publicKey;
    }

    public get privateKey(): string {
        return this._privateKey;
    }
}