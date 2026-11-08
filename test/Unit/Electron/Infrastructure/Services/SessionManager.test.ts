import { randomUUID } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { CiphertextMessageType } from '@signalapp/libsignal-client';
import { SessionManager } from '../../../../../src/Electron/Infrastructure/Services/SessionManager.js';
import { SignalProtocolStore } from '../../../../../src/Electron/Infrastructure/Services/SignalProtocolStore.js';
import { ProtocolStore } from '../../../../../src/Electron/Infrastructure/Persistence/Repositories/ProtocolStore.js';
import { KeyGenerator } from '../../../../../src/Electron/Infrastructure/Services/KeyGenerator.js';
import {
    CreatePreKeyBundleRequest,
    IKeyStoreProvider,
    PreKeyBundle,
} from '../../../../../src/Electron/Application/Contracts/Providers/IKeyStoreProvider.js';
import { IDeviceRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IDeviceRepository.js';
import { Device } from '../../../../../src/Electron/Domain/Entities/Device.js';
import { IdentityKeys } from '../../../../../src/Electron/Domain/Encryption/IdentityKeys.js';
import { SignedPreKey } from '../../../../../src/Electron/Domain/Encryption/SignedPreKey.js';
import { EcPreKey } from '../../../../../src/Electron/Domain/Encryption/EcPreKey.js';
import { KyberPreKey } from '../../../../../src/Electron/Domain/Encryption/KyberPreKey.js';
import { SessionRecord } from '../../../../../src/Electron/Domain/Encryption/SessionRecord.js';
import { IdentityCache } from '../../../../../src/Electron/Domain/Encryption/IdentityCache.js';
import { Envelope, Payload, PayloadType } from '../../../../../src/Electron/Domain/Protocol/Payload.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';
import { UntrustedDeviceError } from '../../../../../src/Electron/Application/Contracts/Services/ISessionManager.js';

/**
 * In-memory stand-in for the sqlite-backed ProtocolStore.
 */
function createProtocolStore() {
    let identityKeys: IdentityKeys | null = null;
    const signedPreKeys = new Map<number, SignedPreKey>();
    const preKeys = new Map<number, EcPreKey>();
    const kyberPreKeys = new Map<number, KyberPreKey>();
    const sessions = new Map<string, SessionRecord>();
    const identities = new Map<string, IdentityCache>();

    const store = {
        createKeyBundle: async (ik: IdentityKeys, spk: SignedPreKey, eks: EcPreKey[], kpk: KyberPreKey) => {
            identityKeys = ik;
            signedPreKeys.set(spk.keyId, spk);
            eks.forEach((k) => preKeys.set(k.id, k));
            kyberPreKeys.set(kpk.id, kpk);
        },
        getRegistrationId: async () => identityKeys!.registrationId,
        getIdentityKeyPair: async () => identityKeys!,
        getSignedPreKey: async (id: number) => signedPreKeys.get(id) ?? null,
        storeSignedPreKey: async (k: SignedPreKey) => void signedPreKeys.set(k.keyId, k),
        getPreKey: async (id: number) => preKeys.get(id) ?? null,
        storePreKey: async (k: EcPreKey) => void preKeys.set(k.id, k),
        deletePreKey: async (id: number) => void preKeys.delete(id),
        getKyberPreKey: async (id: number) => kyberPreKeys.get(id) ?? null,
        storeKyberPreKey: async (k: KyberPreKey) => void kyberPreKeys.set(k.id, k),
        getSession: async (address: string) => sessions.get(address) ?? null,
        storeSession: async (r: SessionRecord) => void sessions.set(r.encodedAddress, r),
        getIdentityCache: async (address: string) => identities.get(address) ?? null,
        saveIdentity: async (i: IdentityCache) => void identities.set(i.encodedAddress, i),
        getUntrustedIdentities: async () => [...identities.values()].filter((i) => !i.trusted),
        getPinnedAccountKey: async () => null,
        savePinnedAccountKey: async () => undefined,
    };

    return { store: store as unknown as ProtocolStore, preKeys };
}

/**
 * In-memory keystore server: stores uploaded bundles and hands out one one-time prekey per fetch.
 */
function createKeyStoreServer() {
    const bundles = new Map<string, CreatePreKeyBundleRequest>();

    const provider: IKeyStoreProvider = {
        createKeyBundle: vi.fn(async (req: CreatePreKeyBundleRequest) => {
            bundles.set(req.accessKey, { ...req, preKeys: [...req.preKeys] });
            return Result.success();
        }),
        getPreKeyBundle: vi.fn(async (accessKey: string) => {
            const req = bundles.get(accessKey);
            if (!req) {
                return Result.fail<PreKeyBundle>(new ErrorMessage(null, 'not found'));
            }
            return Result.success<PreKeyBundle>({
                identityKey: req.identityKey,
                registrationId: req.registrationId,
                signedPrekeyId: req.signedPreKeyId,
                signedPreKeyPublic: req.signedPreKeyPublic,
                signedPreKeySignature: req.signedPreKeySignature,
                preKey: req.preKeys.shift() ?? null,
                kyberPreKeyId: req.kyberPreKeyId,
                kyberPreKeyPublic: req.kyberPreKeyPublic,
                kyberPreKeySignature: req.kyberPreKeySignature,
            });
        }),
        getPreKeyCount: vi.fn(async () => Result.success({ keyCount: 0 })),
        uploadPreKeys: vi.fn(async () => Result.success()),
    };

    return provider;
}

async function createParty(server: IKeyStoreProvider, connectionId: string = randomUUID()) {
    const { store: protocolStore, preKeys } = createProtocolStore();
    const deviceRepository = {
        get: async () => new Device(`device-${connectionId}`, connectionId, '', ''),
    } as unknown as IDeviceRepository;

    const keyGenerator = new KeyGenerator(server, protocolStore);
    const identity = keyGenerator.generateIdentity();
    await keyGenerator.generateKeyBundle(connectionId, identity);

    const mainWindow = { isDestroyed: () => false, webContents: { send: vi.fn() } };
    const verifier = { verify: vi.fn(async (_connectionId: string, _signalIdentityKey: string) => true) };
    const sessionManager = new SessionManager(new SignalProtocolStore(protocolStore, verifier), server, deviceRepository, mainWindow as never);

    return { connectionId, sessionManager, preKeys, mainWindow, verifier, identity };
}

function envelope(text: string): Envelope<Payload> {
    return new Envelope(PayloadType.ChatMessage, { text } as unknown as Payload);
}

function messageType(ciphertext: string): number {
    return JSON.parse(ciphertext).type;
}

describe('SessionManager', () => {
    test('establishes a session and round-trips messages in both directions', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);

        const first = await alice.sessionManager.encrypt(envelope('hello bob'), bob.connectionId);
        expect(messageType(first)).toBe(CiphertextMessageType.PreKey);

        const received = await bob.sessionManager.decrypt(first, alice.connectionId);
        expect(received).toEqual(envelope('hello bob'));

        const reply = await bob.sessionManager.encrypt(envelope('hi alice'), alice.connectionId);
        expect(messageType(reply)).toBe(CiphertextMessageType.Whisper);
        expect(await alice.sessionManager.decrypt(reply, bob.connectionId)).toEqual(envelope('hi alice'));

        const followUp = await alice.sessionManager.encrypt(envelope('how are you'), bob.connectionId);
        expect(messageType(followUp)).toBe(CiphertextMessageType.Whisper);
        expect(await bob.sessionManager.decrypt(followUp, alice.connectionId)).toEqual(envelope('how are you'));
    });

    test('rejects a message when the sender address differs from the one it encrypted as', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);

        const first = await alice.sessionManager.encrypt(envelope('hello bob'), bob.connectionId);

        await expect(bob.sessionManager.decrypt(first, randomUUID())).rejects.toThrow('decryption failed');
    });

    test('reuses an existing session instead of fetching a new bundle', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);

        await alice.sessionManager.encrypt(envelope('one'), bob.connectionId);
        await alice.sessionManager.encrypt(envelope('two'), bob.connectionId);

        expect(server.getPreKeyBundle).toHaveBeenCalledTimes(1);
    });

    test('consumes the one-time prekey on the receiving side', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);
        expect(bob.preKeys.size).toBe(100);

        const first = await alice.sessionManager.encrypt(envelope('hello'), bob.connectionId);
        await bob.sessionManager.decrypt(first, alice.connectionId);

        expect(bob.preKeys.size).toBe(99);
    });

    test('decrypts every message when encrypts to the same peer run concurrently', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);

        const texts = ['a', 'b', 'c', 'd', 'e'];
        const ciphertexts = await Promise.all(
            texts.map((t) => alice.sessionManager.encrypt(envelope(t), bob.connectionId)),
        );

        expect(server.getPreKeyBundle).toHaveBeenCalledTimes(1);
        for (const [i, ciphertext] of ciphertexts.entries()) {
            expect(await bob.sessionManager.decrypt(ciphertext, alice.connectionId)).toEqual(envelope(texts[i]));
        }
    });

    test('round-trips an attachment blob', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bytes = new TextEncoder().encode('attachment bytes');

        const { cipher, key, iv } = await alice.sessionManager.encryptBlob(bytes);

        expect(await alice.sessionManager.decryptBlob(cipher, key, iv)).toEqual(bytes);
    });
});

describe('KeyGenerator', () => {
    test('uploads a Kyber last-resort prekey with the bundle', async () => {
        const server = createKeyStoreServer();
        await createParty(server);

        const req = (server.createKeyBundle as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreatePreKeyBundleRequest;
        expect(req.kyberPreKeyId).toBeGreaterThan(0);
        expect(req.kyberPreKeyPublic.length).toBeGreaterThan(0);
        expect(req.kyberPreKeySignature.length).toBeGreaterThan(0);
        expect(req.preKeys).toHaveLength(100);
    });

    test('throws when the key bundle upload fails', async () => {
        const server = createKeyStoreServer();
        (server.createKeyBundle as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            Result.fail(new ErrorMessage(null, 'keystore down')),
        );
        const { store } = createProtocolStore();
        const keyGenerator = new KeyGenerator(server, store);

        await expect(keyGenerator.generateKeyBundle(randomUUID(), keyGenerator.generateIdentity())).rejects.toThrow(
            'Failed to upload key bundle: keystore down',
        );
    });

    test('refuses a known device whose identity key changed, and keeps refusing it', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);
        await bob.sessionManager.decrypt(await alice.sessionManager.encrypt(envelope('hello bob'), bob.connectionId), alice.connectionId);

        const mallory = await createParty(server, bob.connectionId);
        const forged = await mallory.sessionManager.encrypt(envelope('it is me, bob'), alice.connectionId);

        await expect(alice.sessionManager.decrypt(forged, bob.connectionId)).rejects.toBeInstanceOf(UntrustedDeviceError);
        expect(await alice.sessionManager.getUntrustedDevices()).toEqual([bob.connectionId]);
        expect(alice.mainWindow.webContents.send).toHaveBeenCalledWith('eventMessage', { kind: 'untrustedDevice', connectionId: bob.connectionId });
        await expect(alice.sessionManager.encrypt(envelope('still there?'), bob.connectionId)).rejects.toBeInstanceOf(UntrustedDeviceError);
    });

    test('lists no untrusted devices while every key matches', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);
        await bob.sessionManager.decrypt(await alice.sessionManager.encrypt(envelope('hi'), bob.connectionId), alice.connectionId);

        expect(await alice.sessionManager.getUntrustedDevices()).toEqual([]);
        expect(await bob.sessionManager.getUntrustedDevices()).toEqual([]);
    });

    test('uploads the identity it was given, so the approval and the bundle carry the same key', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);

        const req = (server.createKeyBundle as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreatePreKeyBundleRequest;
        expect(req.identityKey).toBe(alice.identity.publicKey);
    });

    test('refuses a device whose chain does not verify, before any session exists, and remembers it', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);
        alice.verifier.verify.mockResolvedValue(false);

        await expect(alice.sessionManager.encrypt(envelope('hi'), bob.connectionId)).rejects.toBeInstanceOf(UntrustedDeviceError);

        expect(alice.verifier.verify).toHaveBeenCalledWith(bob.connectionId, bob.identity.publicKey);
        expect(await alice.sessionManager.getUntrustedDevices()).toEqual([bob.connectionId]);
        expect(alice.mainWindow.webContents.send).toHaveBeenCalledWith('eventMessage', { kind: 'untrustedDevice', connectionId: bob.connectionId });
    });

    test('refuses an incoming session from a device whose chain does not verify', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);
        bob.verifier.verify.mockResolvedValue(false);

        const first = await alice.sessionManager.encrypt(envelope('hello bob'), bob.connectionId);

        await expect(bob.sessionManager.decrypt(first, alice.connectionId)).rejects.toBeInstanceOf(UntrustedDeviceError);
        expect(bob.verifier.verify).toHaveBeenCalledWith(alice.connectionId, alice.identity.publicKey);
    });

    test('verifies a device only once, when its identity is first seen', async () => {
        const server = createKeyStoreServer();
        const alice = await createParty(server);
        const bob = await createParty(server);

        await alice.sessionManager.encrypt(envelope('one'), bob.connectionId);
        await alice.sessionManager.encrypt(envelope('two'), bob.connectionId);

        expect(alice.verifier.verify).toHaveBeenCalledOnce();
    });
});
