import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { Result } from '../../../Shared/Result/Result';
import { GetRegistrationIdQuery } from  '../../../Electron/Application/Features/Encryption/Queries/GetRegistrationId/GetRegistrationIdQuery';
import { GetIdentityKeyPairQuery } from  '../../../Electron/Application/Features/Encryption/Queries/GetIdentityKeyPair/GetIdentityKeyPairQuery';

export class LocalKeyStore implements libsignal.StorageType {
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

    public async removeSignedPreKey(keyId: number | string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async getIdentityKeyPair(): Promise<libsignal.KeyPairType> {
        const keyResult = await window.electron.sendRequestAsync<Result<libsignal.KeyPairType>>(new GetIdentityKeyPairQuery());
        if (!keyResult.success || keyResult.data === undefined) {
            throw new Error('Failed to get identity key pair: ' + keyResult.errorMessage);
        }
        return keyResult.data!;
    }

    public async getLocalRegistrationId(): Promise<number> {
        const result = await window.electron.sendRequestAsync<Result<number>>(new GetRegistrationIdQuery());
        if (!result.success || result.data === undefined) {
            throw new Error('Failed to get local registration ID: ' + result.errorMessage);
        }
        return result.data!;
    }

    async isTrustedIdentity(
        identifier: string,
        identityKey: ArrayBuffer,
        direction: libsignal.Direction,
    ): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}
