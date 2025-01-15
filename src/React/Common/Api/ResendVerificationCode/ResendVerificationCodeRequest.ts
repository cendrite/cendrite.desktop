export enum CodeType {
    EmailVerification = 1,
    Login = 2,
    PasswordReset = 3
}

export interface ResendVerificationCodeRequest {
    userId: string;
    codeType: CodeType;
}