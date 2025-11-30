import { Result } from '../../../../Shared/Result/Result';
import { ApiClient } from '../ApiClient';
import { API_URLS } from '../ApiUrls';

export interface CreateKeyBundleRequest {
    accessKey: string;
    identityKey: string;
    registrationId: number;
    signedPreKeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    signedPreKeyTimestamp: Date;
    preKeys: { keyId: number; publicKey: string }[];
}

export class CreateKeyBundleApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.KEYSTORE.CREATE_KEY_BUNDLE, true);
    }

    public async createKeyBundle(req: CreateKeyBundleRequest): Promise<Result<void>>{
        return this.client.handleConduit<void>({
            method: 'POST',
            data: req,
        });
    }
}
