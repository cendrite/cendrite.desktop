import { Result } from "../../../../../Shared/Result/Result.js";
import { ApiClient } from "../../ApiClient.js";
import { API_URLS } from "../../ApiUrls.js";

export interface GetNonceRequest {
    UserId: string;
    DeviceId: string;
}

export interface GetNonceResponse {
    nonceId: string;
    deviceId: string;
    nonceValue: string;
}

export class GetNonceApi{
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.AUTH.GET_NONCE, false);
    }

    public async getNonce(request: GetNonceRequest): Promise<Result<GetNonceResponse>> {
        return this.client.handle<GetNonceResponse>({
            method: "GET",
            params: request
        });
    }
}
