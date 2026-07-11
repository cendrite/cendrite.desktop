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
    private readonly loginApiClient: ApiClient;
    private readonly logoutApiClient: ApiClient;

    constructor(loginClient: ApiClient, logoutClient: ApiClient) {
        this.loginApiClient = loginClient;
        this.logoutApiClient = logoutClient;
    }

    login(req: LoginRequest): Promise<Result<LoginResponse>> {
        return this.loginApiClient.handleConduit<LoginResponse>({
            method: 'POST',
            url: '/login',
            data: req,
        });
    }

    verifyLogin(req: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>> {
        return this.loginApiClient.handle<VerifyLoginResponse>({
            method: 'POST',
            url: '/verify-login',
            data: req,
        });
    }

    logout(): Promise<Result<void>> {
        return this.logoutApiClient.handle({
            method: 'POST',
            url: '/logout',
        });
    }
}
