import { Result } from "../../../../Shared/Result/Result";
import { ApiClient } from "../ApiClient";
import { API_URLS } from "../ApiUrls";

export interface PreKeyBundle {
    identityKey: string;
    registrationId: number;
    signedPreKeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    preKey: { keyId: number; publicKey: string } | null;
}


export class GetPreKeyBundleApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.KEYSTORE.GET_PRE_KEY_BUNDLE, true);
    }

    public async getPreKeyBundle(accessKey: string): Promise<Result<PreKeyBundle>> {
        return this.client.handleConduit<PreKeyBundle>({
            method: 'GET',
            params: { accessKey },
        });
    }
}
