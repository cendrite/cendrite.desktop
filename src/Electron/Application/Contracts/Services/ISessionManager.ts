import { Envelope, Payload } from "#electron/Domain/Protocol/Payload";

export class UntrustedDeviceError extends Error {
    constructor(public readonly connectionId: string) {
        super(`The identity key of device ${connectionId} changed and is not trusted.`);
        this.name = 'UntrustedDeviceError';
    }
}

export interface ISessionManager {
    encrypt(envelope: Envelope<Payload>, connectionId: string): Promise<string>;
    decrypt(ciphertext: string, connectionId: string): Promise<Envelope<Payload>>;
    encryptBlob(bytes: Uint8Array): Promise<{ cipher: Uint8Array; key: string; iv: string }>;
    decryptBlob(cipherBytes: Uint8Array, key: string, iv: string): Promise<Uint8Array>;
    getUntrustedDevices(): Promise<string[]>;
}
