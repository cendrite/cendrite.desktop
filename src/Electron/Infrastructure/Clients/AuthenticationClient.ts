import { Result } from '#shared/Result/Result';
import {
    AccountKeyResponse,
    IAuthenticationProvider,
    RecoverRequest,
    RecoverResponse,
    RecoveryChallengeResponse,
    RotateAccountKeyRequest,
    SignupChallengeResponse,
    SignupRequest,
    SignupResponse,
} from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { ApiClient } from './Base/ApiClient.js';

export class AuthenticationClient implements IAuthenticationProvider {
    private readonly authClient: ApiClient;
    private readonly logoutClient: ApiClient;
    private readonly identityUserClient: ApiClient;
    private readonly accountClient: ApiClient;

    constructor(
        authApiClient: ApiClient,
        logoutApiClient: ApiClient,
        identityUserApiClient: ApiClient,
        deviceManagementApiClient: ApiClient,
    ) {
        this.authClient = authApiClient;
        this.logoutClient = logoutApiClient;
        this.identityUserClient = identityUserApiClient;
        this.accountClient = deviceManagementApiClient;
    }

    logout(): Promise<Result<void>> {
        return this.logoutClient.handleConduit({
            method: 'POST',
            url: '/logout',
        });
    }

    getSignupChallenge(): Promise<Result<SignupChallengeResponse>> {
        return this.authClient.handleConduit<SignupChallengeResponse>({
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

    getRecoveryChallenge(accountPublicKey: string): Promise<Result<RecoveryChallengeResponse>> {
        return this.authClient.handleConduit<RecoveryChallengeResponse>({
            method: 'POST',
            url: 'recovery-challenge',
            data: { accountPublicKey },
        });
    }

    recover(req: RecoverRequest): Promise<Result<RecoverResponse>> {
        return this.identityUserClient.handleConduit<RecoverResponse>({
            method: 'POST',
            url: 'recover',
            data: req,
        });
    }

    getAccountKey(): Promise<Result<AccountKeyResponse>> {
        return this.accountClient.handleConduit<AccountKeyResponse>({
            method: 'GET',
            url: 'account-key',
        });
    }

    rotateAccountKey(req: RotateAccountKeyRequest): Promise<Result> {
        return this.accountClient.handleConduit<void>({
            method: 'PUT',
            url: 'account-key',
            data: req,
        }, true);
    }
}
