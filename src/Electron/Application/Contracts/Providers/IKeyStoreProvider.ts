import { Result } from "#shared/Result/Result";

export interface PreKeyBundle {
    identityKey: string;
    registrationId: number;
    signedPrekeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    preKey: { keyId: number; publicKey: string } | null;
    kyberPreKeyId: number;
    kyberPreKeyPublic: string;
    kyberPreKeySignature: string;
}

export interface CreatePreKeyBundleRequest {
    accessKey: string;
    identityKey: string;
    registrationId: number;
    signedPreKeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    signedPreKeyTimestamp: Date;
    preKeys: { keyId: number; publicKey: string }[];
    kyberPreKeyId: number;
    kyberPreKeyPublic: string;
    kyberPreKeySignature: string;
}

export interface PublicPreKey {
    keyId: number;
    publicKey: string;
}


export interface IKeyStoreProvider {
    createKeyBundle(req: CreatePreKeyBundleRequest): Promise<Result<void>>;
    getPreKeyBundle(accessKey: string): Promise<Result<PreKeyBundle>>;
    getPreKeyCount(id: string): Promise<Result<{ KeyCount: number }>>;
    uploadPreKeys(keys: PublicPreKey[]): Promise<Result<void>>;
}
