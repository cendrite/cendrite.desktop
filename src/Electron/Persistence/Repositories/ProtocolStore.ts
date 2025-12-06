import { SignedPreKey } from '../../Domain/Encryption/SignedPreKey.js';
import { EcPreKey } from '../../Domain/Encryption/EcPreKey.js';
import { IdentityKeys } from '../../Domain/Encryption/IdentityKeys.js';
import { IdentityCache } from '../../Domain/Encryption/IdentityCache.js';
import { getDbContext } from '../Context/DatabaseContext.js';
import { SessionRecord } from '../../Domain/Encryption/SessionRecord.js';

export class ProtocolStore {
    private readonly signedPreKeysRepository = getDbContext().getRepository(SignedPreKey);
    private readonly ecPreKeyRepository = getDbContext().getRepository(EcPreKey);
    private readonly sessionRepository = getDbContext().getRepository(SessionRecord);
    private readonly identityKeysRepository = getDbContext().getRepository(IdentityKeys);
    private readonly identityCacheRepository = getDbContext().getRepository(IdentityCache);

    /**
     * Save a new key bundle consisting of identity keys, a signed prekey, and EC prekeys.
     * @param identityKeys Identity keys to store.
     * @param signedPrekey Signed prekey to store.
     * @param ecPreKeys Array of EC prekeys to store.
     */
    public async createKeyBundle(
        identityKeys: IdentityKeys,
        signedPrekey: SignedPreKey,
        ecPreKeys: EcPreKey[],
    ): Promise<void> {
        await this.identityKeysRepository.save(identityKeys);
        await this.signedPreKeysRepository.save(signedPrekey);
        await this.ecPreKeyRepository.save(ecPreKeys);
    }

    public async getRegistrationId(): Promise<number> {
        const result = await this.identityKeysRepository.find({ take: 1 });
        if (result.length === 0) {
            throw new Error('No identity keys found');
        }
        return result[0].registrationId;
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

    public async getIdentity(encodedAddress: string): Promise<IdentityCache | null> {
        return await this.identityCacheRepository.findOne({ where: { encodedAddress } });
    }

    public async saveIdentity(identity: IdentityCache): Promise<void> {
        await this.identityCacheRepository.save(identity);
    }

    /** 
     * Clear all stored cryptographic data: signed prekeys, 
     * EC prekeys, sender keys, session records, 
     * identity keys, and identity cache. 
     * */
    public async deleteAll(): Promise<void> {
        await this.signedPreKeysRepository.clear();
        await this.ecPreKeyRepository.clear();
        await this.sessionRepository.clear();
        await this.identityKeysRepository.clear();
        await this.identityCacheRepository.clear();
    }
}
