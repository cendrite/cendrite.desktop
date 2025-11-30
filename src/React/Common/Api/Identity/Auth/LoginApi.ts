import { Result } from "../../../../../Shared/Result/Result";
import {ApiClient} from "../../ApiClient.ts";
import {API_URLS} from "../../ApiUrls.ts";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    userId: string;
    isVerified: boolean;
}

export class LoginApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.AUTH.LOGIN, false);
    }

    public async login(request: LoginRequest): Promise<Result<LoginResponse>> {
        return this.client.handleConduit<LoginResponse>({
            method: "POST",
            data: request
        });
    }
}
