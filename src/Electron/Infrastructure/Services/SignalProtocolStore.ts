import {
    Direction,
    IdentityChange,
    IdentityKeyPair,
    IdentityKeyStore,
    KyberPreKeyRecord,
    KyberPreKeyStore,
    PreKeyRecord,
    PreKeyStore,
    PrivateKey,
    ProtocolAddress,
    PublicKey,
    SessionRecord,
    SessionStore,
    SignedPreKeyRecord,
    SignedPreKeyStore,
} from '@signalapp/libsignal-client';
import { ProtocolStore } from '../Persistence/Repositories/ProtocolStore.js';
import { IdentityCache } from '../../Domain/Encryption/IdentityCache.js';
import { EcPreKey } from '../../Domain/Encryption/EcPreKey.js';
import { SignedPreKey } from '../../Domain/Encryption/SignedPreKey.js';
import { KyberPreKey } from '../../Domain/Encryption/KyberPreKey.js';
import { SessionRecord as SessionRecordEntity } from '../../Domain/Encryption/SessionRecord.js';

/**
 * Adapter between libsignal's store interfaces and our persisted protocol state.
 */
export class SignalProtocolStore
    implements SessionStore, IdentityKeyStore, PreKeyStore, SignedPreKeyStore, KyberPreKeyStore
{
    private readonly procolStore: ProtocolStore;

    constructor(protocolStore: ProtocolStore) {
        this.procolStore = protocolStore;
    }

    // --- SessionStore ---

    public async saveSession(address: ProtocolAddress, record: SessionRecord): Promise<void> {
        await this.procolStore.storeSession(
            new SessionRecordEntity(address.toString(), Buffer.from(record.serialize())),
        );
    }

    public async getSession(address: ProtocolAddress): Promise<SessionRecord | null> {
        const entity = await this.procolStore.getSession(address.toString());
        if (!entity) {
            return null;
        }
        return SessionRecord.deserialize(toBytes(entity.record));
    }

    public async getExistingSessions(addresses: ProtocolAddress[]): Promise<SessionRecord[]> {
        return Promise.all(
            addresses.map(async (address) => {
                const session = await this.getSession(address);
                if (!session) {
                    throw new Error(`No session for ${address.toString()}`);
                }
                return session;
            }),
        );
    }

    // --- IdentityKeyStore ---

    public async getIdentityKey(): Promise<PrivateKey> {
        const identityKeys = await this.procolStore.getIdentityKeyPair();
        return PrivateKey.deserialize(toBytes(identityKeys.identityKeyPrivate));
    }

    public async getIdentityKeyPair(): Promise<IdentityKeyPair> {
        const identityKeys = await this.procolStore.getIdentityKeyPair();
        return new IdentityKeyPair(
            PublicKey.deserialize(toBytes(identityKeys.identityKeyPublic)),
            PrivateKey.deserialize(toBytes(identityKeys.identityKeyPrivate)),
        );
    }

    public async getLocalRegistrationId(): Promise<number> {
        return await this.procolStore.getRegistrationId();
    }

    /**
     * libsignal only calls this after isTrustedIdentity has passed, so a changed key is stored as the new trusted key.
     */
    public async saveIdentity(address: ProtocolAddress, key: PublicKey): Promise<IdentityChange> {
        const encodedAddress = address.toString();
        const publicKey = Buffer.from(key.serialize());
        const existing = await this.procolStore.getIdentityCache(encodedAddress);

        if (!existing) {
            await this.procolStore.saveIdentity(new IdentityCache(encodedAddress, publicKey, true, Date.now()));
            return IdentityChange.NewOrUnchanged;
        }

        const replaced = !existing.identityKeyPublic.equals(publicKey);

        existing.identityKeyPublic = publicKey;
        existing.timestamp = Date.now();
        existing.trusted = true;
        await this.procolStore.saveIdentity(existing);

        return replaced ? IdentityChange.ReplacedExisting : IdentityChange.NewOrUnchanged;
    }

    /**
     * Trust on first use: unknown identities are trusted, known ones must match the cached key.
     */
    public async isTrustedIdentity(address: ProtocolAddress, key: PublicKey, _direction: Direction): Promise<boolean> {
        const identityCache = await this.procolStore.getIdentityCache(address.toString());
        if (!identityCache) {
            return true;
        }

        return identityCache.trusted && identityCache.identityKeyPublic.equals(Buffer.from(key.serialize()));
    }

    public async getIdentity(address: ProtocolAddress): Promise<PublicKey | null> {
        const identityCache = await this.procolStore.getIdentityCache(address.toString());
        if (!identityCache) {
            return null;
        }
        return PublicKey.deserialize(toBytes(identityCache.identityKeyPublic));
    }

    // --- PreKeyStore ---

    public async savePreKey(id: number, record: PreKeyRecord): Promise<void> {
        await this.procolStore.storePreKey(
            new EcPreKey(
                id,
                Buffer.from(record.privateKey().serialize()),
                Buffer.from(record.publicKey().serialize()),
            ),
        );
    }

    public async getPreKey(id: number): Promise<PreKeyRecord> {
        const preKey = await this.procolStore.getPreKey(id);
        if (!preKey) {
            throw new Error(`PreKey ${id} not found`);
        }
        return PreKeyRecord.new(
            id,
            PublicKey.deserialize(toBytes(preKey.publicKey)),
            PrivateKey.deserialize(toBytes(preKey.privateKey)),
        );
    }

    public async removePreKey(id: number): Promise<void> {
        await this.procolStore.deletePreKey(id);
    }

    // --- SignedPreKeyStore ---

    public async saveSignedPreKey(id: number, record: SignedPreKeyRecord): Promise<void> {
        await this.procolStore.storeSignedPreKey(
            new SignedPreKey(
                id,
                Buffer.from(record.publicKey().serialize()),
                Buffer.from(record.privateKey().serialize()),
                Buffer.from(record.signature()),
                new Date(record.timestamp()),
            ),
        );
    }

    public async getSignedPreKey(id: number): Promise<SignedPreKeyRecord> {
        const signedPreKey = await this.procolStore.getSignedPreKey(id);
        if (!signedPreKey) {
            throw new Error(`SignedPreKey ${id} not found`);
        }
        return SignedPreKeyRecord.new(
            id,
            signedPreKey.createdAt.getTime(),
            PublicKey.deserialize(toBytes(signedPreKey.publicKey)),
            PrivateKey.deserialize(toBytes(signedPreKey.privateKey)),
            toBytes(signedPreKey.signature),
        );
    }

    // --- KyberPreKeyStore ---

    public async saveKyberPreKey(id: number, record: KyberPreKeyRecord): Promise<void> {
        await this.procolStore.storeKyberPreKey(new KyberPreKey(id, Buffer.from(record.serialize())));
    }

    public async getKyberPreKey(id: number): Promise<KyberPreKeyRecord> {
        const kyberPreKey = await this.procolStore.getKyberPreKey(id);
        if (!kyberPreKey) {
            throw new Error(`KyberPreKey ${id} not found`);
        }
        return KyberPreKeyRecord.deserialize(toBytes(kyberPreKey.record));
    }

    /**
     * No-op: we only publish a last-resort Kyber prekey, which is reused and never consumed.
     */
    public async markKyberPreKeyUsed(_id: number, _signedPreKeyId: number, _baseKey: PublicKey): Promise<void> {}
}

/**
 * Copies a Buffer into a Uint8Array backed by its own ArrayBuffer, which is what libsignal's typings require.
 */
function toBytes(buffer: Buffer) {
    return new Uint8Array(buffer);
}
