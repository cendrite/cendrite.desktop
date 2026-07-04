import { Result } from '../../../../Shared/Result/Result';
import { ApiClient } from '../ApiClient';
import { API_URLS } from '../ApiUrls';

export class MediaApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.MEDIA.BASE, true);
    }

    public async upload(mediaId: string, senderId: string, cipher: Uint8Array): Promise<Result> {
        return this.client.handle({
            url: API_URLS.MEDIA.UPLOAD,
            method: 'POST',
            params: { mediaId, senderId },
            data: cipher,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });
    }

    public async get(mediaId: string): Promise<Result<Uint8Array>> {
        const result = await this.client.handleConduit<ArrayBuffer>({
            method: 'GET',
            params: { id: mediaId },
            responseType: 'arraybuffer',
        });

        if (!result.success) return Result.fail<Uint8Array>(result.errorMessage!);
        return Result.success(new Uint8Array(result.data!));
    }

    public async ack(mediaId: string, senderId: string): Promise<Result> {
        return this.client.handle({
            url: `/${mediaId}${API_URLS.MEDIA.ACK}`,
            method: 'POST',
            params: { senderId },
        });
    }
}
