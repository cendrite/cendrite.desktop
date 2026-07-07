import { Result } from "../../../../../Shared/Result/Result.js";
import { ApiClient } from "../../ApiClient.js";
import { API_URLS } from "../../ApiUrls.js";

export interface RefreshTokenApiResponse {
    jwt: string;
    refreshToken: string;
    expiresAt: string;
}

export interface RefreshTokenApiRequest {
    userId: string;
    deviceId: string;
    refreshToken: string;
}

export class RefreshTokenApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.AUTH.REFRESH_TOKEN, false);
    }

    public async refreshToken(request: RefreshTokenApiRequest): Promise<Result<RefreshTokenApiResponse>> {
        return this.client.handle<RefreshTokenApiResponse>({
            method: "POST",
            data: request
        });
    }
}
