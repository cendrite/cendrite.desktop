import { Result } from "../../../../../Shared/Result/Result";
import {ApiClient} from "../../ApiClient.ts";
import {API_URLS} from "../../ApiUrls.ts";

export interface VerifyLoginRequest {
    userId: string;
    loginVerificationCode: string;
}

export interface VerifyLoginResponse {
    nonceId: string;
    nonce: string;
}


export class VerifyLoginApi{
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.AUTH.VERIFY_LOGIN, false);
    }

    public async verifyLogin(request: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>> {
        return this.client.handle<VerifyLoginResponse>({
            method: "POST",
            data: request
        });
    }
}