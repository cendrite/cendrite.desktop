import { IKeyStoreProvider } from '../../Application/Contracts/Providers/IKeyStoreProvider.js';
import { ISessionManager } from '../Interfaces/ISessionManager.js';
import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { KeyService } from './KeyStore.js';
import { mapBundleToDevice } from '../Mappers/KeyMapper.js';
import { Payload } from '../Signal/Messaging/ServerMessage.js';

export class SessionManager implements ISessionManager {
    private readonly keyService: KeyService;
    private readonly keyProvider: IKeyStoreProvider;
    private connectionId: string | null = null;

    constructor(keyStore: KeyService, keyProvider: IKeyStoreProvider) {
        this.keyService = keyStore;
        this.keyProvider = keyProvider;
    }


    private get address(): libsignal.SignalProtocolAddress {
        if (this.connectionId === null) {
            throw new Error('Connection ID is not set');
        }

        return new libsignal.SignalProtocolAddress(
            this.connectionId,
            SessionManager.generateAddressId(this.connectionId),
        );
    }

    public setConnectionId(connectionId: string): void {
        this.connectionId = connectionId;
    }

    /**
     * Ensures that a session exists for the given connectionId. If no session exists, it retrieves the pre-key bundle
     * from the KeyService and processes it to establish a new session.
     */
    private async ensureSession(): Promise<void> {
        const session = await this.keyService.loadSession(this.address.toString());
        if (session) {
            return;
        }

        const preKeyBundleResult = await this.keyProvider.getPreKeyBundle(this.connectionId!);
        if (!preKeyBundleResult.success) {
            throw new Error('Failed to retrieve pre-key bundle: ' + preKeyBundleResult.errorMessage);
        }

        const preKeyBundle = preKeyBundleResult.data!;

        const builder = new libsignal.SessionBuilder(this.keyService, this.address);

        const mappedBundle = mapBundleToDevice(preKeyBundle);

        console.log(mappedBundle);
        await builder.processPreKey(mappedBundle);
    }

    /**
     * Encrypts a payload object into a ciphertext string.
     * @param payload The payload object to encrypt.
     * @returns A promise that resolves to the encrypted ciphertext string.
     */
    public async encrypt(payload: Payload): Promise<string> {
        await this.ensureSession();

        const sessionCipher = new libsignal.SessionCipher(this.keyService, this.address);

        const plainTextStr = JSON.stringify(payload);

        const messageBuffer = SessionManager.convertToBuffer(plainTextStr);

        const ciphertext = await sessionCipher.encrypt(messageBuffer);

        return JSON.stringify({
            type: ciphertext.type,
            body: ciphertext.body ? btoa(ciphertext.body) : '',
        });
    }

    /**
     * Decrypts a ciphertext string into a payload object.
     * @param ciphertext The ciphertext string to decrypt.
     * @returns A promise that resolves to the decrypted payload object.
     */
    public async decrypt<T extends Payload>(ciphertext: string): Promise<T> {
        const { type, body } = JSON.parse(ciphertext);

        const cipher = new libsignal.SessionCipher(this.keyService, this.address);

        const bodyBuffer = body ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0)).buffer : new ArrayBuffer(0);

        let plaintextBuffer: ArrayBuffer;

        if (type === 3) {
            plaintextBuffer = await cipher.decryptPreKeyWhisperMessage(bodyBuffer, 'binary');
        } else {
            plaintextBuffer = await cipher.decryptWhisperMessage(bodyBuffer, 'binary');
        }

        const decryptedMsg = new TextDecoder().decode(plaintextBuffer);
        return JSON.parse(decryptedMsg);
    }

    /**
     * Encrypts an attachment blob with a fresh, single-use AES-GCM key.
     * This does NOT touch the ratchet — only the returned key/iv (carried inside the
     * ratchet-encrypted pointer) tie the blob back to the session.
     */
    public async encryptBlob(bytes: Uint8Array): Promise<{ cipher: Uint8Array; key: string; iv: string }> {
        const rawKey = crypto.getRandomValues(new Uint8Array(32));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
        const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);

        return {
            cipher: new Uint8Array(cipher),
            key: SessionManager.toBase64(rawKey),
            iv: SessionManager.toBase64(iv),
        };
    }

    /**
     * Decrypts an attachment blob using the key/iv recovered from the pointer.
     */
    public async decryptBlob(cipherBytes: Uint8Array, key: string, iv: string): Promise<Uint8Array> {
        const cryptoKey = await crypto.subtle.importKey('raw', SessionManager.fromBase64(key), 'AES-GCM', false, [
            'decrypt',
        ]);

        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: SessionManager.fromBase64(iv) },
            cryptoKey,
            cipherBytes,
        );

        return new Uint8Array(plaintext);
    }

    private static toBase64(bytes: Uint8Array): string {
        return btoa(String.fromCharCode(...bytes));
    }

    private static fromBase64(value: string): Uint8Array {
        return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    }

    private static generateAddressId(connectionId: string): number {
        let h = 0;
        for (let i = 0; i < connectionId.length; i++) {
            h = (h * 31 + connectionId.charCodeAt(i)) | 0;
        }
        return Math.abs(h);
    }

    private static convertToBuffer(str: string): ArrayBuffer {
        const encoder = new TextEncoder();
        return encoder.encode(str).buffer;
    }
}
