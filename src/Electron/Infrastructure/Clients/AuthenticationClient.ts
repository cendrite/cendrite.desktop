import { Result } from '../../../Shared/Result/Result.js';
import {
    IAuthenticationProvider,
    LoginRequest,
    LoginResponse,
    VerifyLoginRequest,
    VerifyLoginResponse,
} from '../../Application/Contracts/Providers/IAuthenticationProvider.js';
import { ApiClient } from './Base/ApiClient.js';

export class AuthenticationClient implements IAuthenticationProvider {
    private readonly loginClient: ApiClient;
    private readonly logoutClient: ApiClient;
    private readonly verifyLoginClient: ApiClient;

    constructor(loginApiClient: ApiClient, logoutApiClient: ApiClient, verifyLoginApiClient: ApiClient) {
        this.loginClient = loginApiClient;
        this.logoutClient = logoutApiClient;
        this.verifyLoginClient = verifyLoginApiClient;
    }

    login(req: LoginRequest): Promise<Result<LoginResponse>> {
        return this.loginClient.handleConduit<LoginResponse>({
            method: 'POST',
            url: '/login',
            data: req,
        });
    }

    verifyLogin(req: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>> {
        return this.verifyLoginClient.handleConduit<VerifyLoginResponse>({
            method: 'POST',
            url: 'verify-login',
            data: req,
        });
    }

    logout(): Promise<Result<void>> {
        return this.logoutClient.handleConduit({
            method: 'POST',
            url: '/logout',
        });
    }
}
