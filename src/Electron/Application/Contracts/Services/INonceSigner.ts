export interface DeviceKeys {
    publicKey: string;
    privateKey: string;
}

export interface INonceSigner {
    signNonce(nonce: string): Promise<string>;
    generateDeviceKeys(): DeviceKeys;
}
