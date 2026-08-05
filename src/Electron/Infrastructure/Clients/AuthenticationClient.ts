import { Result } from '../../../Shared/Result/Result.js';
import {
    IAuthenticationProvider,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationCodeRequest,
    VerifyLoginRequest,
    VerifyLoginResponse,
    VerifyUserRequest,
} from '../../Application/Contracts/Providers/IAuthenticationProvider.js';
import { ApiClient } from './Base/ApiClient.js';

export class AuthenticationClient implements IAuthenticationProvider {
    private readonly loginClient: ApiClient;
    private readonly logoutClient: ApiClient;
    private readonly verifyLoginClient: ApiClient;
    private readonly identityUserClient: ApiClient;

    constructor(
        loginApiClient: ApiClient,
        logoutApiClient: ApiClient,
        verifyLoginApiClient: ApiClient,
        identityUserApiClient: ApiClient,
    ) {
        this.loginClient = loginApiClient;
        this.logoutClient = logoutApiClient;
        this.verifyLoginClient = verifyLoginApiClient;
        this.identityUserClient = identityUserApiClient;
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

    register(req: RegisterRequest): Promise<Result<RegisterResponse>> {
        return this.identityUserClient.handle<RegisterResponse>({
            method: 'POST',
            data: req,
        });
    }

    verifyUser(req: VerifyUserRequest): Promise<Result> {
        return this.identityUserClient.handle<void>({
            method: 'PUT',
            url: 'verify',
            data: req,
        });
    }

    resendVerificationCode(req: ResendVerificationCodeRequest): Promise<Result> {
        return this.identityUserClient.handle<void>({
            method: 'PUT',
            url: 'resend-verification',
            data: req,
        });
    }
}
