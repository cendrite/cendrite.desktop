import { KeyService } from '../../Common/Services/KeyService';
import { LocalKeyStore } from './LocalKeyStore';
import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { convertToBuffer, generateAddressId } from './Utilities';
import { mapBundleToDevice } from './KeyMapper';
import { Payload } from '../../SignalR/Messaging/ServerMessage';

export class SessionManager {
    private keyStore: libsignal.StorageType = new LocalKeyStore();
    private keyService: KeyService = new KeyService();

    constructor(private connectionId: string) { }

    private get address(): libsignal.SignalProtocolAddress {
        return new libsignal.SignalProtocolAddress(this.connectionId, generateAddressId(this.connectionId));
    }

    private async ensureSession(): Promise<void> {
        const session = await this.keyStore.loadSession(this.address.toString());
        if (session) {
            return;
        }

        const preKeyBundleResult = await this.keyService.GetKeyBundle(this.connectionId);
        if (!preKeyBundleResult.success) {
            throw new Error('Failed to retrieve pre-key bundle: ' + preKeyBundleResult.errorMessage);
        }

        const preKeyBundle = preKeyBundleResult.data!;

        const builder = new libsignal.SessionBuilder(this.keyStore, this.address);

        const mappedBundle = mapBundleToDevice(preKeyBundle);

        console.log(mappedBundle);
        await builder.processPreKey(mappedBundle);
    }

    public async encrypt(payload: Payload): Promise<string> {
        await this.ensureSession();

        const sessionCipher = new libsignal.SessionCipher(this.keyStore, this.address);

        const plainTextStr = JSON.stringify(payload);

        const messageBuffer = convertToBuffer(plainTextStr);

        const ciphertext = await sessionCipher.encrypt(messageBuffer);

        return JSON.stringify({
            type: ciphertext.type,
            body: ciphertext.body ? btoa(ciphertext.body) : '',
        });
    }

    public async decrypt<T extends Payload>(ciphertext: string): Promise<T> {
        const { type, body } = JSON.parse(ciphertext);

        const cipher = new libsignal.SessionCipher(this.keyStore, this.address);

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
    public static async encryptBlob(bytes: Uint8Array): Promise<{ cipher: Uint8Array; key: string; iv: string }> {
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
    public static async decryptBlob(cipher: Uint8Array, key: string, iv: string): Promise<Uint8Array> {
        const cryptoKey = await crypto.subtle.importKey('raw', SessionManager.fromBase64(key), 'AES-GCM', false, [
            'decrypt',
        ]);

        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: SessionManager.fromBase64(iv) },
            cryptoKey,
            cipher,
        );

        return new Uint8Array(plaintext);
    }

    private static toBase64(bytes: Uint8Array): string {
        return btoa(String.fromCharCode(...bytes));
    }

    private static fromBase64(value: string): Uint8Array {
        return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    }
}
