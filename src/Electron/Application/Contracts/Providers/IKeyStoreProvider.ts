import { Result } from "../../../../Shared/Result/Result.js";

export interface PreKeyBundle {
    identityKey: string;
    registrationId: number;
    signedPrekeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    preKey: { keyId: number; publicKey: string } | null;
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
}

export interface IKeyStoreProvider {
    createKeyBundle(req: CreatePreKeyBundleRequest): Promise<Result<void>>;
    getPreKeyBundle(accessKey: string): Promise<Result<PreKeyBundle>>;
}
