import { SignedPreKey } from '#electron/Domain/Encryption/SignedPreKey';
import { EcPreKey } from '#electron/Domain/Encryption/EcPreKey';
import { IdentityKeys } from '#electron/Domain/Encryption/IdentityKeys';
import { IdentityCache } from '#electron/Domain/Encryption/IdentityCache';
import { SessionRecord } from '#electron/Domain/Encryption/SessionRecord';
import { KyberPreKey } from '#electron/Domain/Encryption/KyberPreKey';

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
