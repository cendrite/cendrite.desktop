import {
    CiphertextMessageType,
    PreKeySignalMessage,
    processPreKeyBundle,
    ProtocolAddress,
    signalDecrypt,
    signalDecryptPreKey,
    signalEncrypt,
    SignalMessage,
} from '@signalapp/libsignal-client';
import { IKeyStoreProvider } from '../../Application/Contracts/Providers/IKeyStoreProvider.js';
import { IDeviceRepository } from '../../Application/Contracts/Repositories/IDeviceRepository.js';
import { ISessionManager } from '../../Application/Contracts/Services/ISessionManager.js';
import { SignalProtocolStore } from './SignalProtocolStore.js';
import { mapToPreKeyBundle } from '../Mappers/KeyMapper.js';
import { Envelope, Payload } from '../../Domain/Protocol/Payload.js';

/**
 * Every client has exactly one device per connectionId, so the libsignal device id is fixed.
 */
const DEVICE_ID = 1;

export class SessionManager implements ISessionManager {
    private readonly store: SignalProtocolStore;
    private readonly keyProvider: IKeyStoreProvider;
    private readonly deviceRepository: IDeviceRepository;

    /**
     * Per-address operation chains. Ratchet state is read-modify-write through the async store,
     * so operations on the same session must not interleave.
     */
    private readonly queues = new Map<string, Promise<unknown>>();

    constructor(
        signalProtocolStore: SignalProtocolStore,
        keyStoreProvider: IKeyStoreProvider,
        deviceRepository: IDeviceRepository,
    ) {
        this.store = signalProtocolStore;
        this.keyProvider = keyStoreProvider;
        this.deviceRepository = deviceRepository;
    }

    private address(connectionId: string): ProtocolAddress {
        return ProtocolAddress.new(connectionId, DEVICE_ID);
    }

    private async localAddress(): Promise<ProtocolAddress> {
        const device = await this.deviceRepository.get();
        if (!device) {
            throw new Error('No local device registered');
        }
        return this.address(device.connectionId);
    }

    /**
     * Ensures that a session exists for the given address. If no usable session exists, it retrieves the
     * pre-key bundle from the keystore and processes it to establish a new session.
     */
    private async ensureSession(address: ProtocolAddress, localAddress: ProtocolAddress): Promise<void> {
        const session = await this.store.getSession(address);
        if (session?.hasCurrentState()) {
            return;
        }

        const preKeyBundleResult = await this.keyProvider.getPreKeyBundle(address.name());
        if (!preKeyBundleResult.success) {
            throw new Error('Failed to retrieve pre-key bundle: ' + preKeyBundleResult.errorMessage.message);
        }

        const bundle = mapToPreKeyBundle(preKeyBundleResult.data, DEVICE_ID);

        await processPreKeyBundle(bundle, address, localAddress, this.store, this.store);
    }

    /**
     * Encrypts an envelope (payload type + payload) into a ciphertext string.
     * @param envelope The envelope to encrypt.
     * @returns A promise that resolves to the encrypted ciphertext string.
     */
    public async encrypt(envelope: Envelope<Payload>, connectionId: string): Promise<string> {
        const address = this.address(connectionId);

        return this.runExclusive(address, async () => {
            const localAddress = await this.localAddress();
            await this.ensureSession(address, localAddress);

            const plaintext = new TextEncoder().encode(JSON.stringify(envelope));
            const ciphertext = await signalEncrypt(plaintext, address, localAddress, this.store, this.store);

            return JSON.stringify({
                type: ciphertext.type(),
                body: Buffer.from(ciphertext.serialize()).toString('base64'),
            });
        });
    }

    /**
     * Decrypts a ciphertext string into an envelope. The caller must switch on
     * envelope.payloadType before trusting the shape of envelope.payload.
     * @param ciphertext The ciphertext string to decrypt.
     * @returns A promise that resolves to the decrypted envelope.
     */
    public async decrypt(ciphertext: string, connectionId: string): Promise<Envelope<Payload>> {
        const { type, body } = JSON.parse(ciphertext);
        const address = this.address(connectionId);
        const bodyBytes = SessionManager.fromBase64(body ?? '');

        const plaintext = await this.runExclusive(address, async () => {
            const localAddress = await this.localAddress();

            if (type === CiphertextMessageType.PreKey) {
                return signalDecryptPreKey(
                    PreKeySignalMessage.deserialize(bodyBytes),
                    address,
                    localAddress,
                    this.store,
                    this.store,
                    this.store,
                    this.store,
                    this.store,
                );
            }

            return signalDecrypt(SignalMessage.deserialize(bodyBytes), address, localAddress, this.store, this.store);
        });

        return JSON.parse(new TextDecoder().decode(plaintext));
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
        const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes as Uint8Array<ArrayBuffer>);

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
            cipherBytes as Uint8Array<ArrayBuffer>,
        );

        return new Uint8Array(plaintext);
    }

    /**
     * Runs fn after every earlier operation queued for the same address has settled.
     */
    private runExclusive<T>(address: ProtocolAddress, fn: () => Promise<T>): Promise<T> {
        const key = address.toString();
        const previous = this.queues.get(key) ?? Promise.resolve();
        const next = previous.catch(() => undefined).then(fn);

        this.queues.set(key, next);
        next.catch(() => undefined).finally(() => {
            if (this.queues.get(key) === next) {
                this.queues.delete(key);
            }
        });

        return next;
    }

    private static toBase64(bytes: Uint8Array): string {
        return Buffer.from(bytes).toString('base64');
    }

    private static fromBase64(value: string) {
        return new Uint8Array(Buffer.from(value, 'base64'));
    }
}
