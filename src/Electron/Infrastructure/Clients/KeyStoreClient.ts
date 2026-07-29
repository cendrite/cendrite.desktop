import { Result } from "../../../Shared/Result/Result.js";
import { CreatePreKeyBundleRequest, IKeyStoreProvider, PreKeyBundle } from "../../Application/Contracts/Providers/IKeyStoreProvider.js";
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
