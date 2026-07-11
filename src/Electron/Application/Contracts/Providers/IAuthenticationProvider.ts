import { Result } from "../../../../Shared/Result/Result.js";

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

export interface IAuthenticationProvider {
    login(req: LoginRequest): Promise<Result<LoginResponse>>;
    verifyLogin(req: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>>;
    logout(): Promise<Result<void>>;
}
