import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { ProtocolStore } from '../Persistence/Repositories/ProtocolStore.js';
import { IdentityCache } from '../../Domain/Encryption/IdentityCache.js';
import { EcPreKey } from '../../Domain/Encryption/EcPreKey.js';
import { SessionRecord } from '../../Domain/Encryption/SessionRecord.js';

export class KeyService implements libsignal.StorageType {
    private readonly procolStore: ProtocolStore;

    constructor(protocolStore: ProtocolStore) {
        this.procolStore = protocolStore;
    }

    public async saveIdentity(
        encodedAddress: string,
        publicKey: ArrayBuffer,
        nonblockingApproval?: boolean,
    ): Promise<boolean> {
        const approval = nonblockingApproval ?? false;
        const existing = await this.procolStore.getIdentityCache(encodedAddress);

        if (!existing) {
            const entry = new IdentityCache(encodedAddress, Buffer.from(publicKey), true, Date.now());

            await this.procolStore.saveIdentity(entry);
            return true;
        }

        const same = existing.identityKeyPublic.equals(Buffer.from(publicKey));
        if (same) {
            existing.timestamp = Date.now();
            await this.procolStore.saveIdentity(existing);
            return true;
        }

        if (!approval) {
            return false;
        }

        existing.identityKeyPublic = Buffer.from(publicKey);
        existing.timestamp = Date.now();
        existing.trusted = true;

        await this.procolStore.saveIdentity(existing);

        return true;
    }

    public async loadPreKey(encodedAddress: string | number): Promise<libsignal.KeyPairType | undefined> {
        const preKeyId = typeof encodedAddress === 'string' ? Number(encodedAddress) : encodedAddress;
        const preKey = await this.procolStore.getPreKey(preKeyId);
        if (!preKey) {
            return undefined;
        }

        return {
            pubKey: preKey.publicKey.buffer,
            privKey: preKey.privateKey.buffer,
        };
    }

    public async storePreKey(keyId: number | string, keyPair: libsignal.KeyPairType): Promise<void> {
        const preKeyId = typeof keyId === 'string' ? Number(keyId) : keyId;
        await this.procolStore.storePreKey(
            new EcPreKey(preKeyId, Buffer.from(keyPair.privKey), Buffer.from(keyPair.pubKey)),
        );
    }

    public async removePreKey(keyId: number | string): Promise<void> {
        const preKeyId = typeof keyId === 'string' ? Number(keyId) : keyId;
        await this.procolStore.deletePreKey(preKeyId);
    }

    public async storeSession(encodedAddress: string, record: libsignal.SessionRecordType): Promise<void> {
        await this.procolStore.storeSession(new SessionRecord(encodedAddress, record));
    }

    public async loadSession(encodedAddress: string): Promise<libsignal.SessionRecordType | undefined> {
        const sessionRecord = await this.procolStore.getSession(encodedAddress);
        if (!sessionRecord) {
            return undefined;
        }
        return sessionRecord.record;
    }

    public async getIdentityKeyPair(): Promise<libsignal.KeyPairType | undefined> {
        const identityKeyPair = await this.procolStore.getIdentityKeyPair();
        if (!identityKeyPair) {
            return undefined;
        }
        return {
            pubKey: identityKeyPair.identityKeyPublic.buffer,
            privKey: identityKeyPair.identityKeyPrivate.buffer,
        };
    }

    public async getLocalRegistrationId(): Promise<number | undefined> {
        return await this.procolStore.getRegistrationId();
    }

    public async isTrustedIdentity(
        identifier: string,
        identityKey: ArrayBuffer,
        _direction: libsignal.Direction,
    ): Promise<boolean> {
        const identityCache = await this.procolStore.getIdentityCache(identifier);

        if (!identityCache) {
            return false;
        }

        const isTrusted = identityCache.trusted && identityCache.identityKeyPublic.equals(Buffer.from(identityKey));
        return isTrusted;
    }

    public async loadSignedPreKey(keyId: number | string): Promise<libsignal.KeyPairType | undefined> {
        const signedPreKeyId = typeof keyId === 'string' ? Number(keyId) : keyId;
        const signedPreKey = await this.procolStore.getSignedPreKey(signedPreKeyId);
        if (!signedPreKey) {
            return undefined;
        }

        return {
            pubKey: signedPreKey.publicKey.buffer,
            privKey: signedPreKey.privateKey.buffer,
        };
    }

    storeSignedPreKey(_keyId: number | string, _keyPair: libsignal.KeyPairType): Promise<void> {
        throw new Error('Method not implemented.');
    }

    removeSignedPreKey(_keyId: number | string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
