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

export interface GetNonceRequest {
    userId: string;
    deviceId: string;
}

export interface GetNonceResponse {
    nonceId: string;
    deviceId: string;
    nonceValue: string;
}

export interface VerifyNonceRequest {
    userId: string;
    deviceId: string;
    nonceId: string;
    nonce: string;
}

export interface VerifyNonceResponse {
    jwt: string;
    refreshToken: string;
    expiresAt: string;
}

export interface RefreshTokenRequest {
    userId: string;
    deviceId: string;
    refreshToken: string;
}

export interface RefreshTokenResponse {
    jwt: string;
    refreshToken: string;
    expiresAt: string;
}

export interface IAuthenticationProvider {
    login(req: LoginRequest): Promise<Result<LoginResponse>>;
    verifyLogin(req: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>>;
    logout(): Promise<Result<void>>;
    getNonce(req: GetNonceRequest): Promise<Result<GetNonceResponse>>;
    verifyNonce(req: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>>;
    refreshToken(req: RefreshTokenRequest): Promise<Result<RefreshTokenResponse>>;
}
