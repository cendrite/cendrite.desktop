import { Result } from "../../../../../Shared/Result/Result";
import {ApiClient} from "../../ApiClient.ts";
import {API_URLS} from "../../ApiUrls.ts";

export interface VerifyUserRequest {
    userId: string;
    verificationCode: string;
}

export class VerifyUserApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.USER.VERIFY_USER, false);
    }

    public async verifyUser(request: VerifyUserRequest): Promise<Result> {
        return this.client.handle<void>({
            method: "PUT",
            data: request
        });
    }
}