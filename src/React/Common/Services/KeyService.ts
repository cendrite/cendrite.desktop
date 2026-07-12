import { Result } from '../../../Shared/Result/Result';
import { PreKeyBundle } from '../Api/KeyStore/GetPreKeyBundleApi.ts';
import { GetPreKeyBundleApi } from '../Api/KeyStore/GetPreKeyBundleApi.ts';

export class KeyService {
    private readonly getPreKeyBundleApi = new GetPreKeyBundleApi();

    public async GetKeyBundle(connectionId: string): Promise<Result<PreKeyBundle>> {
        return await this.getPreKeyBundleApi.getPreKeyBundle(connectionId);
    }
}
