export interface DeviceKeys {
    publicKey: string;
    privateKey: string;
}

export interface INonceSigner {
    signNonce(nonce: string): Promise<string>;
    generateDeviceKeys(): DeviceKeys;
    signDeviceApproval(accountPublicKey: string, devicePublicKey: string, signalIdentityKey: string): Promise<string>;
    signAccountRotation(oldAccountPublicKey: string, newAccountPublicKey: string): Promise<string>;
}
