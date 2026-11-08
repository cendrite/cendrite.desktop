export interface IDeviceVerifier {
    verify(connectionId: string, signalIdentityKey: string): Promise<boolean>;
}
