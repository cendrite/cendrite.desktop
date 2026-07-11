import { Result } from "../../../Shared/Result/Result.js";
import { GetNonceRequest, GetNonceResponse, ITokenProvider, RefreshTokenRequest, RefreshTokenResponse, VerifyNonceRequest, VerifyNonceResponse } from "../../Application/Contracts/Providers/ITokenProvider.js";
import { ApiClient } from "./Base/ApiClient.js";

export class TokenClient implements ITokenProvider {
    private readonly tokenClient: ApiClient;

    constructor(tokenApiClient: ApiClient) {
        this.tokenClient = tokenApiClient;
    }

    getNonce(req: GetNonceRequest): Promise<Result<GetNonceResponse>> {
        return this.tokenClient.handle<GetNonceResponse>({
            method: 'GET',
            url: "nonce",
            params: req,
        });
    }

    verifyNonce(req: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>> {
        return this.tokenClient.handle<VerifyNonceResponse>({
            method: 'POST',
            url: "verify-nonce",
            data: req,
        });
    }

    refreshToken(req: RefreshTokenRequest): Promise<Result<RefreshTokenResponse>> {
        return this.tokenClient.handle<RefreshTokenResponse>({
            method: 'POST',
            url: "refresh-token",
            data: req,
        });
    }

}
