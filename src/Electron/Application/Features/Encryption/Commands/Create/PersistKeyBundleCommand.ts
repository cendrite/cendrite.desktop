export class PersistKeyBundleCommand implements MediatorRequest {
    public type = 'PersistKeyBundleCommand';
    public cacheToken: string;

    constructor(cacheToken: string) {
        this.cacheToken = cacheToken;
    }
}
