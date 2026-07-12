import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';

export class KeyStore implements libsignal.StorageType {
    public async getIdentityKeyPair(): Promise<libsignal.KeyPairType | undefined> {
        throw new Error('Method not implemented.');
    }

    getLocalRegistrationId(): Promise<number | undefined> {
        throw new Error('Method not implemented.');
    }

    isTrustedIdentity(identifier: string, identityKey: ArrayBuffer, direction: libsignal.Direction): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    saveIdentity(encodedAddress: string, publicKey: ArrayBuffer, nonblockingApproval?: boolean): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    loadPreKey(encodedAddress: string | number): Promise<libsignal.KeyPairType | undefined> {
        throw new Error('Method not implemented.');
    }

    storePreKey(keyId: number | string, keyPair: libsignal.KeyPairType): Promise<void> {
        throw new Error('Method not implemented.');
    }

    removePreKey(keyId: number | string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    storeSession(encodedAddress: string, record: libsignal.SessionRecordType): Promise<void> {
        throw new Error('Method not implemented.');
    }

    loadSession(encodedAddress: string): Promise<libsignal.SessionRecordType | undefined> {
        throw new Error('Method not implemented.');
    }

    loadSignedPreKey(keyId: number | string): Promise<libsignal.KeyPairType | undefined> {
        throw new Error('Method not implemented.');
    }

    storeSignedPreKey(keyId: number | string, keyPair: libsignal.KeyPairType): Promise<void> {
        throw new Error('Method not implemented.');
    }

    removeSignedPreKey(keyId: number | string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
