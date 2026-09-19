import { SignedPreKey } from '../../Domain/Encryption/SignedPreKey.js';
import { EcPreKey } from '../../Domain/Encryption/EcPreKey.js';
import { IdentityKeys } from '../../Domain/Encryption/IdentityKeys.js';
import { IdentityCache } from '../../Domain/Encryption/IdentityCache.js';
import { SessionRecord } from '../../Domain/Encryption/SessionRecord.js';
import { KyberPreKey } from '../../Domain/Encryption/KyberPreKey.js';

export interface IProtocolStore {
    createKeyBundle(
        identityKeys: IdentityKeys,
        signedPrekey: SignedPreKey,
        ecPreKeys: EcPreKey[],
        kyberPreKey: KyberPreKey,
    ): Promise<void>;
    getRegistrationId(): Promise<number>;
    getIdentityKeyPair(): Promise<IdentityKeys>;
    getSignedPreKey(keyId: number): Promise<SignedPreKey | null>;
    storeSignedPreKey(signedPreKey: SignedPreKey): Promise<void>;
    getPreKey(id: number): Promise<EcPreKey | null>;
    storePreKey(preKey: EcPreKey): Promise<void>;
    deletePreKey(id: number): Promise<void>;
    getKyberPreKey(id: number): Promise<KyberPreKey | null>;
    storeKyberPreKey(kyberPreKey: KyberPreKey): Promise<void>;
    getSession(address: string): Promise<SessionRecord | null>;
    storeSession(record: SessionRecord): Promise<void>;
    getIdentityCache(encodedAddress: string): Promise<IdentityCache | null>;
    saveIdentity(identity: IdentityCache): Promise<void>;
    deleteAll(): Promise<void>;
}
