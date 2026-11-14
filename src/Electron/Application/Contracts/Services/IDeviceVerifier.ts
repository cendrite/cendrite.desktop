export interface VerifiedDevice {
    userTag: string;
    removed: boolean;
}

export interface IDeviceVerifier {
    verify(connectionId: string, signalIdentityKey: string): Promise<VerifiedDevice | null>;
}
