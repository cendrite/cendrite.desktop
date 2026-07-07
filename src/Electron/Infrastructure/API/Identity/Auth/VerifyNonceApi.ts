import { Result } from "../../../../../Shared/Result/Result.js";
import { ApiClient } from "../../ApiClient.js";
import { API_URLS } from "../../ApiUrls.js";

export interface VerifyNonceRequest {
    userId: string;
    deviceId: string;
    nonceId: string;
    nonce: string;
}

export interface VerifyNonceResponse {
    jwt: string;
    refreshToken: string;
    expiresAt: string;
}

export class VerifyNonceApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.AUTH.VERIFY_NONCE, false);
    }

    public async verifyNonce(request: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>> {
        return this.client.handle<VerifyNonceResponse>({
            method: "POST",
            data: request
        });
    }
}

