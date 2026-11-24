import { Envelope, Payload } from "#electron/Domain/Protocol/Payload";

export class UnreachableDeviceError extends Error {
    constructor(public readonly connectionId: string, message: string) {
        super(message);
        this.name = 'UnreachableDeviceError';
    }
}

export class UntrustedDeviceError extends UnreachableDeviceError {
    constructor(connectionId: string) {
        super(connectionId, `The identity key of device ${connectionId} changed and is not trusted.`);
        this.name = 'UntrustedDeviceError';
    }
}

export class DeviceGoneError extends UnreachableDeviceError {
    constructor(connectionId: string) {
        super(connectionId, `Device ${connectionId} has no key bundle, so it has logged out or been removed.`);
        this.name = 'DeviceGoneError';
    }
}

export interface ISessionManager {
    encrypt(envelope: Envelope<Payload>, connectionId: string): Promise<string>;
    decrypt(ciphertext: string, connectionId: string): Promise<Envelope<Payload>>;
    encryptBlob(bytes: Uint8Array): Promise<{ cipher: Uint8Array; key: string; iv: string }>;
    decryptBlob(cipherBytes: Uint8Array, key: string, iv: string): Promise<Uint8Array>;
    getUntrustedDevices(): Promise<string[]>;
}
