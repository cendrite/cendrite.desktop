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

export interface IAuthenticationProvider {
    logout(): Promise<Result<void>>;
    getSignupChallenge(): Promise<Result<SignupChallengeResponse>>;
    signup(req: SignupRequest): Promise<Result<SignupResponse>>;
}
