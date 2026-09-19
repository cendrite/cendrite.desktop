import { Result } from '../../../Shared/Result/Result.js';
import { IMediaProvider } from '../../Application/Contracts/Providers/IMediaProvider.js';
import { ApiClient } from './Base/ApiClient.js';

export class MediaProvider implements IMediaProvider {
    private readonly client: ApiClient;

    constructor(mediaApiClient: ApiClient) {
        this.client = mediaApiClient;
    }

    public async upload(id: string, cipher: Uint8Array): Promise<Result> {
        return this.client.handle({
            url: 'upload',
            method: 'POST',
            params: { mediaId: id },
            data: cipher,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });
    }

    public async get(id: string): Promise<Result<Uint8Array>> {
        const result = await this.client.handleConduit<ArrayBuffer>({
            method: 'GET',
            params: { id: id },
            responseType: 'arraybuffer',
        });

        if (!result.success) return Result.fail<Uint8Array>(result.errorMessage!);
        return Result.success(new Uint8Array(result.data!));
    }

    public async ack(id: string): Promise<Result> {
        return this.client.handle({
            url: `${id}/ack`,
            method: 'POST',
        });
    }
}
