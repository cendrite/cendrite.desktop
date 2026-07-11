import { Result } from "../../../Shared/Result/Result.js";
import { GetNonceRequest, GetNonceResponse, ITokenProvider, RefreshTokenRequest, RefreshTokenResponse, VerifyNonceRequest, VerifyNonceResponse } from "../../Application/Contracts/Providers/ITokenProvider.js";
import { ApiClient } from "./Base/ApiClient.js";

export class TokenClient implements ITokenProvider {
    private readonly tokenClient: ApiClient;

    constructor(tokenApiClient: ApiClient) {
        this.tokenClient = tokenApiClient;
    }

    getNonce(req: GetNonceRequest): Promise<Result<GetNonceResponse>> {
        return this.tokenClient.handleConduit<GetNonceResponse>({
            method: 'GET',
            url: "nonce",
            params: req,
        });
    }

    verifyNonce(req: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>> {
        return this.tokenClient.handleConduit<VerifyNonceResponse>({
            method: 'POST',
            url: "verify-nonce",
            data: req,
        });
    }

    refreshToken(req: RefreshTokenRequest): Promise<Result<RefreshTokenResponse>> {
        return this.tokenClient.handleConduit<RefreshTokenResponse>({
            method: 'POST',
            url: "refresh-token",
            data: req,
        });
    }

}
