import { Payload } from "../Signal/Messaging/ServerMessage.js";

export interface ISessionManager {
    encrypt(payload: Payload, connectionId: string): Promise<string>;
    decrypt<T extends Payload>(ciphertext: string, connectionId: string): Promise<T>;
    encryptBlob(bytes: Uint8Array): Promise<{ cipher: Uint8Array; key: string; iv: string }>;
    decryptBlob(cipherBytes: Uint8Array, key: string, iv: string): Promise<Uint8Array>;
}
