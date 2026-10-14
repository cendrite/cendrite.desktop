import { Result } from "#shared/Result/Result";
import { CreatePreKeyBundleRequest, IKeyStoreProvider, PreKeyBundle } from "#electron/Application/Contracts/Providers/IKeyStoreProvider";
import { ApiClient } from "./Base/ApiClient.js";

export class KeyStoreClient implements IKeyStoreProvider {
    private readonly client: ApiClient;

    constructor(keyStoreApiClient: ApiClient) {
        this.client = keyStoreApiClient;
    }

    createKeyBundle(req: CreatePreKeyBundleRequest): Promise<Result<void>> {
        return this.client.handleConduit<void>({
            method: 'POST',
            data: req,
        });
    }

    getPreKeyBundle(accessKey: string): Promise<Result<PreKeyBundle>> {
        return this.client.handleConduit<PreKeyBundle>({
            url: 'session',
            method: 'GET',
            params: { accessKey },
        });
    }
}
