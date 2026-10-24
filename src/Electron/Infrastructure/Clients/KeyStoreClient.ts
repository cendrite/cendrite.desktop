import { Result } from '#shared/Result/Result';
import {
    CreatePreKeyBundleRequest,
    IKeyStoreProvider,
    PreKeyBundle,
    PublicPreKey,
} from '#electron/Application/Contracts/Providers/IKeyStoreProvider';
import { ApiClient } from './Base/ApiClient.js';

export class KeyStoreClient implements IKeyStoreProvider {
    private readonly client: ApiClient;

    constructor(keyStoreApiClient: ApiClient) {
        this.client = keyStoreApiClient;
    }

    public async getPreKeyCount(id: string): Promise<Result<{ KeyCount: number }>> {
        return this.client.handleConduit<{ KeyCount: number }>({
            url: 'session/count',
            method: 'GET',
            params: { id },
        });
    }

    public async createKeyBundle(req: CreatePreKeyBundleRequest): Promise<Result<void>> {
        return this.client.handleConduit<void>({
            method: 'POST',
            data: req,
        });
    }

    public async getPreKeyBundle(accessKey: string): Promise<Result<PreKeyBundle>> {
        return this.client.handleConduit<PreKeyBundle>({
            url: 'session',
            method: 'GET',
            params: { accessKey },
        });
    }

    public async uploadPreKeys(preKeys: PublicPreKey[]): Promise<Result<void>> {
        return this.client.handleConduit<void>({
            url: 'opts/',
            method: 'POST',
            data: { preKeys },
        });
    }
}
