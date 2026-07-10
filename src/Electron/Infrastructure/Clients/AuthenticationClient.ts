import { Result } from '../../../Shared/Result/Result.js';
import {
    GetNonceRequest,
    GetNonceResponse,
    IAuthenticationProvider,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    VerifyLoginRequest,
    VerifyLoginResponse,
    VerifyNonceRequest,
    VerifyNonceResponse,
} from '../../Application/Contracts/Services/IAuthenticationProvider.js';
import { ApiClient } from '../API/ApiClient.js';
import { API_URLS } from './Base/Urls.js';

export class AuthenticationClient implements IAuthenticationProvider {
    private readonly apiClient: ApiClient;
    private readonly old_client: ApiClient;
    private readonly authenticated_client: ApiClient;

    constructor() {
        this.apiClient = new ApiClient(API_URLS.IDENTITY.AUTH, false);
        this.old_client = new ApiClient(API_URLS.IDENTITY.AUTH_OLD, false);
        this.authenticated_client = new ApiClient(API_URLS.IDENTITY.AUTH_OLD, true);
    }

    login(req: LoginRequest): Promise<Result<LoginResponse>> {
        return this.apiClient.handleConduit<LoginResponse>({
            method: 'POST',
            url: "/login",
            data: req,
        });
    }

    verifyLogin(req: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>> {
        return this.old_client.handle<VerifyLoginResponse>({
            method: 'POST',
            url: "/verify-login",
            data: req,
        });
    }

    logout(): Promise<Result<void>> {
        return this.authenticated_client.handle({
            method: 'POST',
            url: "/logout",
        });
    }

    getNonce(req: GetNonceRequest): Promise<Result<GetNonceResponse>> {
        return this.old_client.handle<GetNonceResponse>({
            method: 'GET',
            url: "/get-nonce",
            params: req,
        });
    }

    verifyNonce(req: VerifyNonceRequest): Promise<Result<VerifyNonceResponse>> {
        return this.old_client.handle<VerifyNonceResponse>({
            method: 'POST',
            url: "/verify-nonce",
            data: req,
        });
    }

    refreshToken(req: RefreshTokenRequest): Promise<Result<RefreshTokenResponse>> {
        return this.old_client.handleConduit<RefreshTokenResponse>({
            method: 'POST',
            url: "/refresh-token",
            data: req,
        });
    }
}
