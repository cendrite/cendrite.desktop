import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { Result } from '../../../Shared/Result/Result';
import { GetRegistrationIdQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetRegistrationId/GetRegistrationIdQuery';
import { GetIdentityKeyPairQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetIdentityKeyPair/GetIdentityKeyPairQuery';
import { GetSessionQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetSession/GetSessionQuery';
import { CreateSessionCommand } from '../../../Electron/Application/Features/Encryption/Commands/Create/Session/CreateSessionCommand';
import { SessionRecordDto } from '../../../Electron/Application/Features/Encryption/Dtos/SessionRecordDto';
import { CreateIdentityCommand } from '../../../Electron/Application/Features/Encryption/Commands/Create/IdentityCache/CreateIdentityCommand';
import { IdentityCacheDto } from '../../../Electron/Application/Features/Encryption/Dtos/IdentityCacheDto';

export class LocalKeyStore implements libsignal.StorageType {
    public async saveIdentity(
        _encodedAddress: string,
        _publicKey: ArrayBuffer,
        _nonblockingApproval?: boolean,
    ): Promise<boolean> {
        const approval = _nonblockingApproval ?? false;
        const saveResult = await window.electron.sendRequestAsync<Result<IdentityCacheDto>>(
            new CreateIdentityCommand(_encodedAddress, Buffer.from(_publicKey), approval),
        );

        if (!saveResult.success || saveResult.data === undefined) {
            throw new Error('Failed to save identity: ' + saveResult.errorMessage);
        }

        return saveResult.data!.isTrusted;
    }

    loadPreKey(_encodedAddress: string | number): Promise<libsignal.KeyPairType | undefined> {
        throw new Error('Method not implemented.');
    }

    storePreKey(_keyId: number | string, _keyPair: libsignal.KeyPairType): Promise<void> {
        throw new Error('Method not implemented.');
    }

    removePreKey(_keyId: number | string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async storeSession(_encodedAddress: string, _record: libsignal.SessionRecordType): Promise<void> {
        const result = await window.electron.sendRequestAsync<Result>(
            new CreateSessionCommand(_encodedAddress, _record),
        );
        if (!result.success) {
            throw new Error('Failed to store session: ' + result.errorMessage);
        }
    }

    public async loadSession(_encodedAddress: string): Promise<libsignal.SessionRecordType | undefined> {
        const sessionResult = await window.electron.sendRequestAsync<Result<SessionRecordDto | null>>(
            new GetSessionQuery(_encodedAddress),
        );
        if (!sessionResult.success) {
            throw new Error('Failed to load session: ' + sessionResult.errorMessage);
        }
        return sessionResult.data?.record;
    }

    loadSignedPreKey(_keyId: number | string): Promise<libsignal.KeyPairType | undefined> {
        throw new Error('Method not implemented.');
    }

    public storeSignedPreKey(_keyId: number | string, _keyPair: libsignal.KeyPairType): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async removeSignedPreKey(_keyId: number | string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async getIdentityKeyPair(): Promise<libsignal.KeyPairType> {
        const keyResult = await window.electron.sendRequestAsync<Result<libsignal.KeyPairType>>(
            new GetIdentityKeyPairQuery(),
        );
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
        _identifier: string,
        _identityKey: ArrayBuffer,
        _direction: libsignal.Direction,
    ): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}
