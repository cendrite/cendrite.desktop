import { Result } from "../../../../Shared/Result/Result";
import { ApiClient } from "../ApiClient";
import { API_URLS } from "../ApiUrls";

export class MediaApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.MEDIA.BASE, true);
    }

    public async upload(mediaId: string, senderId: string, file: File): Promise<Result> {
        const formData = new FormData();
        formData.append("file", file);

        return this.client.handle({
            method: "POST",
            params: { mediaId, senderId },
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    }

    public async get(mediaId: string): Promise<Result<Blob>> {
        return this.client.handle({
            method: "GET",
            params: { mediaId },
            responseType: "blob"
        });
    }

    public async ack(mediaId: string, senderId: string): Promise<Result> {
        return this.client.handle({
            method: "POST",
            params: { mediaId, senderId }
        });
    }
}
