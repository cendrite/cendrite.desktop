import { Payload } from "../Signal/Messaging/ServerMessage.js";

export interface ISessionManager {
    setConnectionId(connectionId: string): void;
    encrypt(payload: Payload): Promise<string>;
    decrypt<T extends Payload>(ciphertext: string): Promise<T>;
    encryptBlob(bytes: Uint8Array): Promise<{ cipher: Uint8Array; key: string; iv: string }>;
    decryptBlob(cipherBytes: Uint8Array, key: string, iv: string): Promise<Uint8Array>;
}
