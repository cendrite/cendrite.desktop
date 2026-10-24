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

    public async getPreKeyCount(): Promise<Result<{ keyCount: number }>> {
        return this.client.handleConduit<{ keyCount: number }>({
            url: 'otps/count',
            method: 'GET',
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
            url: 'otps',
            method: 'POST',
            data: { preKeys },
        });
    }
}
