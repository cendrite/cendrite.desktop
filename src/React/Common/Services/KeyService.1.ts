import { Result } from "../../../Shared/Result/Result";
import { CreateKeyBundleApi } from "../Api/KeyStore/CreateKeyBundleApi";




export class KeyService {
    private readonly createKeyBundleApi = new CreateKeyBundleApi();

    public async SaveKeys(connectionId: string): Promise<Result<void>> {
        var generationResult = await window.electron.sendRequestAsync<Result<GenerateKeyBundleDto>>(
            new GenerateKeyBundleCommand(connectionId)
        );
    }
}

