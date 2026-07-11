import { Result } from "../../../../Shared/Result/Result.js";

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

export interface ITokenProvider {
    getNonce(req: GetNonceRequest): Promise<Result<GetNonceResponse>>;
    verifyNonce(req: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>>;
    refreshToken(req: RefreshTokenRequest): Promise<Result<RefreshTokenResponse>>;
}
