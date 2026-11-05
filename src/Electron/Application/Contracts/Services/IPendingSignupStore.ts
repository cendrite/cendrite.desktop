export interface SignupRegistration {
    userId: string;
    deviceId: string;
    connectionId: string;
    devicePublicKey: string;
    devicePrivateKey: string;
}

export interface PendingSignup {
    words: string[];
    confirmIndices: number[];
    registration: SignupRegistration | null;
}

export interface IPendingSignupStore {
    set(pendingSignup: PendingSignup): void;
    get(): PendingSignup | null;
    clear(): void;
}
