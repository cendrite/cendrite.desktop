import { Result } from "#shared/Result/Result";
import { GetNonceRequest, GetNonceResponse, ITokenProvider, VerifyNonceRequest, VerifyNonceResponse } from "#electron/Application/Contracts/Providers/ITokenProvider";
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
}
