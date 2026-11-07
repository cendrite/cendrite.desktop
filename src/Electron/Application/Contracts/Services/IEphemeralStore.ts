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

export interface EphemeralEntries {
    signup: PendingSignup;
    rotation: PendingRotation;
    deviceLink: PendingDeviceLink;
}

export interface IEphemeralStore {
    set<K extends keyof EphemeralEntries>(key: K, value: EphemeralEntries[K]): void;
    get<K extends keyof EphemeralEntries>(key: K): EphemeralEntries[K] | null;
    clear(key: keyof EphemeralEntries): void;
    clearAll(): void;
}
