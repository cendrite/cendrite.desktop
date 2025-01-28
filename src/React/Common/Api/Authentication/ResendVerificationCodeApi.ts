import { AxiosError } from 'axios';
import { Result } from '../../../../Shared/Result/Result';
import { AuthenticationBaseAPI } from '../BaseApi';
import { ErrorMessage } from '../../../../Shared/Result/ErrorMessage';

export enum CodeType {
    EmailVerification = 1,
    Login = 2,
    PasswordReset = 3
}

export interface ResendVerificationCodeRequest {
    userId: string;
    codeType: CodeType;
}

export class ResendCodeApi extends AuthenticationBaseAPI<ResendVerificationCodeRequest> {
    public async handle(request: ResendVerificationCodeRequest): Promise<Result<void>> {
        try {
            await this.api.put('/User/resend-verification', request);
            return Result.success();
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const errorMessage = error.response.data?.errorMessage || "An error occurred while registering.";
                return Result.fail(ErrorMessage.fromApiResponse("RegistrationFailed", errorMessage));
            }
            console.error("Unexpected error during registration:", error);
            return Result.fail(ErrorMessage.fromApiResponse("RegistrationFailed", "An unexpected error occurred."));
        }
    }
}