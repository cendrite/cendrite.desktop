import { Result } from "#shared/Result/Result";

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
    announce: boolean;
}

export interface VerifyNonceResponse {
    jwt: string;
    expiresAt: string;
}

export interface ITokenProvider {
    getNonce(req: GetNonceRequest): Promise<Result<GetNonceResponse>>;
    verifyNonce(req: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>>;
}
