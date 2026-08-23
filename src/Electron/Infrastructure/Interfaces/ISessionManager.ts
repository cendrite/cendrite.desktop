import { Envelope, Payload } from "../Signal/Messaging/ServerMessage.js";

export interface ISessionManager {
    encrypt(envelope: Envelope<Payload>, connectionId: string): Promise<string>;
    decrypt(ciphertext: string, connectionId: string): Promise<Envelope<Payload>>;
    encryptBlob(bytes: Uint8Array): Promise<{ cipher: Uint8Array; key: string; iv: string }>;
    decryptBlob(cipherBytes: Uint8Array, key: string, iv: string): Promise<Uint8Array>;
}
