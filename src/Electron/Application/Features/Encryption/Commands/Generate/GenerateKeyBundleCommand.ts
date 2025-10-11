export class GenerateKeyBundleCommand implements MediatorRequest {
    public type = 'GenerateKeyBundleCommand';
    public connectionId: string;

    constructor(connectionId: string) {
        this.connectionId = connectionId;
    }
}
