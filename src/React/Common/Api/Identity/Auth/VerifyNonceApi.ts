import {ApiClient} from "../../ApiClient.ts";
import {API_URLS} from "../../ApiUrls.ts";
import {Result} from "../../../../../Shared/Result/Result.ts";

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

