import { Result } from "#shared/Result/Result";
import { CodeType } from "#shared/Enums/CodeType";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    userId: string;
    isVerified: boolean;
    nonceId: string | null;
    nonce: string | null;
}

export interface VerifyLoginRequest {
    userId: string;
    loginVerificationCode: string;
    nonceId: string;
    nonce: string;
}

export interface VerifyLoginResponse {
    nonceId: string;
    nonce: string;
}

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

export interface VerifyUserRequest {
    userId: string;
    verificationCode: string;
}

export interface ResendVerificationCodeRequest {
    userId: string;
    codeType: CodeType;
    nonceId?: string;
    nonce?: string;
}

export interface IAuthenticationProvider {
    login(req: LoginRequest): Promise<Result<LoginResponse>>;
    verifyLogin(req: VerifyLoginRequest): Promise<Result<VerifyLoginResponse>>;
    logout(): Promise<Result<void>>;
    getSignupChallenge(): Promise<Result<SignupChallengeResponse>>;
    signup(req: SignupRequest): Promise<Result<SignupResponse>>;
    verifyUser(req: VerifyUserRequest): Promise<Result>;
    resendVerificationCode(req: ResendVerificationCodeRequest): Promise<Result>;
}
