import { Result } from '#shared/Result/Result';
import { IMediaProvider } from '#electron/Application/Contracts/Providers/IMediaProvider';
import { ApiClient } from './Base/ApiClient.js';

export class MediaProvider implements IMediaProvider {
    private readonly client: ApiClient;

    constructor(mediaApiClient: ApiClient) {
        this.client = mediaApiClient;
    }

    public async upload(cipher: Uint8Array): Promise<Result<string>> {
        const result = await this.client.handleConduit<{ mediaId: string }>({
            url: 'upload',
            method: 'POST',
            data: cipher,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });

        if (!result.success) return Result.fail<string>(result.errorMessage);
        return Result.success(result.data.mediaId);
    }

    public async get(id: string): Promise<Result<Uint8Array>> {
        const result = await this.client.handleConduit<ArrayBuffer>({
            method: 'GET',
            params: { id: id },
            responseType: 'arraybuffer',
        });

        if (!result.success) return Result.fail<Uint8Array>(result.errorMessage);
        return Result.success(new Uint8Array(result.data));
    }

    public async ack(id: string): Promise<Result> {
        return this.client.handle({
            url: `${id}/ack`,
            method: 'POST',
        });
    }
}
