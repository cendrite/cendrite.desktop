export class PersistKeyBundleCommand implements MediatorRequest {
    public type = PersistKeyBundleCommand.name;
    public cacheToken: string;

    constructor(cacheToken: string) {
        this.cacheToken = cacheToken;
    }
}
