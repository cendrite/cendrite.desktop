import { Result } from "../../../../Shared/Result/Result.js";
import { CodeType } from "../../../../Shared/Contracts/Enums/CodeType.js";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    userId: string;
    isVerified: boolean;
}

export interface VerifyLoginRequest {
    userId: string;
    loginVerificationCode: string;
}

export interface VerifyLoginResponse {
    nonceId: string;
    nonce: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    email: string;
    id: string;
}

export interface VerifyUserRequest {
    userId: string;
    verificationCode: string;
}

export interface ResendVerificationCodeRequest {
    userId: string;
    codeType: CodeType;
}

export interface IAuthenticationProvider {
    login(req: LoginRequest): Promise<Result<LoginResponse>>;
    verifyLogin(req: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>>;
    logout(): Promise<Result<void>>;
    register(req: RegisterRequest): Promise<Result<RegisterResponse>>;
    verifyUser(req: VerifyUserRequest): Promise<Result>;
    resendVerificationCode(req: ResendVerificationCodeRequest): Promise<Result>;
}
