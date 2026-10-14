import { SignedPreKey } from '#electron/Domain/Encryption/SignedPreKey';
import { EcPreKey } from '#electron/Domain/Encryption/EcPreKey';
import { IdentityKeys } from '#electron/Domain/Encryption/IdentityKeys';
import { IdentityCache } from '#electron/Domain/Encryption/IdentityCache';
import { getDbContext } from '../Context/DatabaseContext.js';
import { SessionRecord } from '#electron/Domain/Encryption/SessionRecord';
import { KyberPreKey } from '#electron/Domain/Encryption/KyberPreKey';
import { IProtocolStore } from '#electron/Infrastructure/Interfaces/IProtocolStore';

export class ProtocolStore implements IProtocolStore {
    private readonly signedPreKeysRepository = getDbContext().getRepository(SignedPreKey);
    private readonly ecPreKeyRepository = getDbContext().getRepository(EcPreKey);
    private readonly kyberPreKeyRepository = getDbContext().getRepository(KyberPreKey);
    private readonly sessionRepository = getDbContext().getRepository(SessionRecord);
    private readonly identityKeysRepository = getDbContext().getRepository(IdentityKeys);
    private readonly identityCacheRepository = getDbContext().getRepository(IdentityCache);

    /**
     * Save a new key bundle consisting of identity keys, a signed prekey, EC prekeys and a last-resort Kyber prekey.
     * @param identityKeys Identity keys to store.
     * @param signedPrekey Signed prekey to store.
     * @param ecPreKeys Array of EC prekeys to store.
     * @param kyberPreKey Last-resort Kyber prekey to store.
     */
    public async createKeyBundle(
        identityKeys: IdentityKeys,
        signedPrekey: SignedPreKey,
        ecPreKeys: EcPreKey[],
        kyberPreKey: KyberPreKey,
    ): Promise<void> {
        await this.identityKeysRepository.save(identityKeys);
        await this.signedPreKeysRepository.save(signedPrekey);
        await this.ecPreKeyRepository.save(ecPreKeys);
        await this.kyberPreKeyRepository.save(kyberPreKey);
    }

    public async getRegistrationId(): Promise<number> {
        const result = await this.identityKeysRepository.find({ take: 1 });
        if (result.length === 0) {
            throw new Error('No identity keys found');
        }
        return result[0].registrationId;
    }

    public async getSignedPreKey(keyId: number): Promise<SignedPreKey | null> {
        return await this.signedPreKeysRepository.findOne({ where: { keyId} });
    }

    public async getIdentityKeyPair(): Promise<IdentityKeys> {
        const result = await this.identityKeysRepository.find({ take: 1 });
        if (result.length === 0) {
            throw new Error('No identity keys found');
        }
        return result[0];
    }

    public async getSession(address: string): Promise<SessionRecord | null> {
        return await this.sessionRepository.findOne({ where: { encodedAddress: address } });
    }

    public async storeSession(record: SessionRecord): Promise<void> {
        await this.sessionRepository.save(record);
    }

    public async getIdentityCache(encodedAddress: string): Promise<IdentityCache | null> {
        return await this.identityCacheRepository.findOne({ where: { encodedAddress } });
    }

    public async saveIdentity(identity: IdentityCache): Promise<void> {
        await this.identityCacheRepository.save(identity);
    }

    public async storeSignedPreKey(signedPreKey: SignedPreKey): Promise<void> {
        await this.signedPreKeysRepository.save(signedPreKey);
    }

    public async storePreKey(preKey: EcPreKey): Promise<void> {
        await this.ecPreKeyRepository.save(preKey);
    }

    public async getPreKey(id: number): Promise<EcPreKey | null> {
        return await this.ecPreKeyRepository.findOne({ where: { id } });
    }

    public async deletePreKey(id: number): Promise<void> {
        await this.ecPreKeyRepository.delete({ id });
    }

    public async storeKyberPreKey(kyberPreKey: KyberPreKey): Promise<void> {
        await this.kyberPreKeyRepository.save(kyberPreKey);
    }

    public async getKyberPreKey(id: number): Promise<KyberPreKey | null> {
        return await this.kyberPreKeyRepository.findOne({ where: { id } });
    }

    /**
     * Clear all stored cryptographic data: signed prekeys,
     * EC prekeys, Kyber prekeys, session records,
     * identity keys, and identity cache.
     * */
    public async deleteAll(): Promise<void> {
        await this.signedPreKeysRepository.clear();
        await this.ecPreKeyRepository.clear();
        await this.kyberPreKeyRepository.clear();
        await this.sessionRepository.clear();
        await this.identityKeysRepository.clear();
        await this.identityCacheRepository.clear();
    }
}
