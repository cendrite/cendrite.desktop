import { Result } from '../../../../../Shared/Result/Result';
import {ApiClient} from "../../ApiClient.ts";
import {API_URLS} from "../../ApiUrls.ts";

export enum CodeType {
    EmailVerification = 1,
    Login = 2,
    PasswordReset = 3
}

export interface ResendVerificationCodeRequest {
    userId: string;
    codeType: CodeType;
}

export class ResendCodeApi{
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.USER.RESEND_VERIFICATION, false);
    }

    public async resendCode(request: ResendVerificationCodeRequest): Promise<Result> {
        return this.client.handle<void>({
            method: "PUT",
            data: request
        });
    }
}