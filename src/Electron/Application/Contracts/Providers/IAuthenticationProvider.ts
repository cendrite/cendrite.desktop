import { Result } from "#shared/Result/Result";

export interface SignupChallengeResponse {
    challengeId: string;
    challenge: string;
    difficulty: number;
    expiresAt: string;
}

export interface SignupRequest {
    username: string;
    accountPublicKey: string;
    challengeId: string;
    powNonce: number;
    challengeSignature: string;
    devicePublicKey: string;
    signalIdentityKey: string;
    deviceApproval: string;
    deviceAppVersion: string;
    deviceType: number;
    devicePlatform: number;
}

export interface SignupResponse {
    userId: string;
    deviceId: string;
    deviceConnectionId: string;
}

export interface RecoveryChallengeResponse {
    challengeId: string;
    challenge: string;
    expiresAt: string;
}

export interface RecoverRequest {
    accountPublicKey: string;
    challengeId: string;
    challengeSignature: string;
    devicePublicKey: string;
    signalIdentityKey: string;
    deviceApproval: string;
    deviceAppVersion: string;
    deviceType: number;
    devicePlatform: number;
}

export interface RecoverResponse {
    userId: string;
    deviceId: string;
    deviceConnectionId: string;
}

export interface AccountKeyResponse {
    accountPublicKey: string;
}

export interface RotateAccountKeyRequest {
    newAccountPublicKey: string;
    proof: string;
    approval: string;
}

export interface IAuthenticationProvider {
    logout(): Promise<Result<void>>;
    getSignupChallenge(): Promise<Result<SignupChallengeResponse>>;
    signup(req: SignupRequest): Promise<Result<SignupResponse>>;
    getRecoveryChallenge(accountPublicKey: string): Promise<Result<RecoveryChallengeResponse>>;
    recover(req: RecoverRequest): Promise<Result<RecoverResponse>>;
    getAccountKey(): Promise<Result<AccountKeyResponse>>;
    rotateAccountKey(req: RotateAccountKeyRequest): Promise<Result>;
}
