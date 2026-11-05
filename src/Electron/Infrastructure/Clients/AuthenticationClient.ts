import { Result } from '#shared/Result/Result';
import {
    IAuthenticationProvider,
    SignupChallengeResponse,
    SignupRequest,
    SignupResponse,
} from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { ApiClient } from './Base/ApiClient.js';

export class AuthenticationClient implements IAuthenticationProvider {
    private readonly loginClient: ApiClient;
    private readonly logoutClient: ApiClient;
    private readonly identityUserClient: ApiClient;

    constructor(
        loginApiClient: ApiClient,
        logoutApiClient: ApiClient,
        identityUserApiClient: ApiClient,
    ) {
        this.loginClient = loginApiClient;
        this.logoutClient = logoutApiClient;
        this.identityUserClient = identityUserApiClient;
    }

    logout(): Promise<Result<void>> {
        return this.logoutClient.handleConduit({
            method: 'POST',
            url: '/logout',
        });
    }

    getSignupChallenge(): Promise<Result<SignupChallengeResponse>> {
        return this.loginClient.handleConduit<SignupChallengeResponse>({
            method: 'GET',
            url: 'signup-challenge',
        });
    }

    signup(req: SignupRequest): Promise<Result<SignupResponse>> {
        return this.identityUserClient.handleConduit<SignupResponse>({
            method: 'POST',
            url: 'signup',
            data: req,
        });
    }
}
