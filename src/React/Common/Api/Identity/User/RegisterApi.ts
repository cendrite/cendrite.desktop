import { Result } from "../../../../../Shared/Result/Result";
import {ApiClient} from "../../ApiClient.ts";
import {API_URLS} from "../../ApiUrls.ts";

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    email: string;
    id: string;
}

export class RegisterApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.USER.REGISTER, false);
    }

    public async register(request: RegisterRequest): Promise<Result<RegisterResponse>> {
        return this.client.handle<RegisterResponse>({
            method: "POST",
            data: request
        });
    }
}