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

export interface PendingRotation {
    words: string[];
    confirmIndices: number[];
}

export interface PendingDeviceLink {
    pendingLinkId: string;
    pollSecret: string;
    devicePublicKey: string;
    devicePrivateKey: string;
}

export interface PendingFlows {
    signup: PendingSignup;
    rotation: PendingRotation;
    deviceLink: PendingDeviceLink;
}

export interface IPendingFlowStore {
    set<K extends keyof PendingFlows>(key: K, value: PendingFlows[K]): void;
    get<K extends keyof PendingFlows>(key: K): PendingFlows[K] | null;
    clear(key: keyof PendingFlows): void;
    clearAll(): void;
}
