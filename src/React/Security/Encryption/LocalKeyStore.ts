import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { Result } from '../../../Shared/Result/Result';
import { GetRegistrationIdQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetRegistrationId/GetRegistrationIdQuery';
import { GetIdentityKeyPairQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetIdentityKeyPair/GetIdentityKeyPairQuery';
import { GetSessionQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetSession/GetSessionQuery';
import { CreateSessionCommand } from '../../../Electron/Application/Features/Encryption/Commands/Create/Session/CreateSessionCommand';
import { SessionRecordDto } from '../../../Electron/Application/Features/Encryption/Dtos/SessionRecordDto';
import { CreateIdentityCommand } from '../../../Electron/Application/Features/Encryption/Commands/Create/IdentityCache/CreateIdentityCommand';
import { CreateIdentityCacheDto } from '../../../Electron/Application/Features/Encryption/Commands/Create/IdentityCache/CreateIdentityCacheDto';
import { GetPreKeyQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetPreKey/GetPreKeyQuery';
import { GetPreKeyDto } from '../../../Electron/Application/Features/Encryption/Queries/GetPreKey/GetPreKeyDto';
import { KeyPairDto } from '../../../Electron/Application/Features/Encryption/Dtos/KeyPairDto';
import { mapFromSignalKeyPair, mapToSignalKeyPair } from './KeyMapper';
import { GetSignedPreKeyQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetSignedPreKey/GetSignedPreKeyQuery';
import { GetSignedPreKeyDto } from '../../../Electron/Application/Features/Encryption/Queries/GetSignedPreKey/GetSignedPreKeyDto';
import { DeletePreKeyCommand } from '../../../Electron/Application/Features/Encryption/Commands/Delete/PreKey/DeletePreKeyCommand';
import { CreatePreKeyCommand } from '../../../Electron/Application/Features/Encryption/Commands/Create/PreKey/CreatePreKeyCommand';
import { IdentityCacheDto } from '../../../Electron/Application/Features/Encryption/Dtos/IdentityCacheDto';
import { GetIdentityCacheQuery } from '../../../Electron/Application/Features/Encryption/Queries/GetIdentityCache/GetIdentityCacheQuery';
import { Buffer } from 'buffer';

export class LocalKeyStore implements libsignal.StorageType {
    public async saveIdentity(
        encodedAddress: string,
        publicKey: ArrayBuffer,
        nonblockingApproval?: boolean,
    ): Promise<boolean> {
        const approval = nonblockingApproval ?? false;
        const saveResult = await window.electron.sendRequestAsync<Result<CreateIdentityCacheDto>>(
            new CreateIdentityCommand(encodedAddress, Buffer.from(publicKey), approval),
        );

        if (!saveResult.success || saveResult.data === undefined) {
            throw new Error('Failed to save identity: ' + saveResult.errorMessage);
        }

        return saveResult.data!.isTrusted;
    }

    public async loadPreKey(encodedAddress: string | number): Promise<libsignal.KeyPairType | undefined> {
        const preKeyId = typeof encodedAddress === 'string' ? Number(encodedAddress) : encodedAddress;
        const preKeyResult = await window.electron.sendRequestAsync<Result<GetPreKeyDto>>(new GetPreKeyQuery(preKeyId));
        if (!preKeyResult.success) {
            throw new Error('Failed to load pre-key: ' + preKeyResult.errorMessage);
        }

        if (preKeyResult.data?.keyPair === null) {
            return undefined;
        }

        const keyPair = mapToSignalKeyPair(preKeyResult.data!.keyPair!);
        return keyPair;
    }

    public async storePreKey(keyId: number | string, _keyPair: libsignal.KeyPairType): Promise<void> {
        const preKeyId = typeof keyId === 'string' ? Number(keyId) : keyId;
        const keyPairDto = mapFromSignalKeyPair(_keyPair);
        await window.electron.sendRequestAsync(new CreatePreKeyCommand(preKeyId, keyPairDto));
    }

    public async removePreKey(keyId: number | string): Promise<void> {
        const preKeyId = typeof keyId === 'string' ? Number(keyId) : keyId;
        await window.electron.sendRequestAsync<Result>(new DeletePreKeyCommand(preKeyId));
    }

    public async storeSession(encodedAddress: string, record: libsignal.SessionRecordType): Promise<void> {
        const result = await window.electron.sendRequestAsync<Result>(new CreateSessionCommand(encodedAddress, record));
        console.log('Store session result:', result);
        if (!result.success) {
            throw new Error('Failed to store session: ' + result.errorMessage);
        }
    }

    public async loadSession(encodedAddress: string): Promise<libsignal.SessionRecordType | undefined> {
        const sessionResult = await window.electron.sendRequestAsync<Result<SessionRecordDto | null>>(
            new GetSessionQuery(encodedAddress),
        );
        if (!sessionResult.success) {
            throw new Error('Failed to load session: ' + sessionResult.errorMessage);
        }
        return sessionResult.data?.record;
    }

    public async loadSignedPreKey(keyId: number | string): Promise<libsignal.KeyPairType | undefined> {
        const signedPreKeyId = typeof keyId === 'string' ? Number(keyId) : keyId;

        const preKeyResult = await window.electron.sendRequestAsync<Result<GetSignedPreKeyDto>>(
            new GetSignedPreKeyQuery(signedPreKeyId),
        );

        if (!preKeyResult.success) {
            throw new Error('Failed to load signed pre-key: ' + preKeyResult.errorMessage);
        }

        if (preKeyResult.data?.keyPair === null) {
            return undefined;
        }

        const keyPair = mapToSignalKeyPair(preKeyResult.data!.keyPair!);
        return keyPair;
    }

    public storeSignedPreKey(_keyId: number | string, _keyPair: libsignal.KeyPairType): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async removeSignedPreKey(_keyId: number | string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async getIdentityKeyPair(): Promise<libsignal.KeyPairType> {
        const keyResult = await window.electron.sendRequestAsync<Result<KeyPairDto>>(new GetIdentityKeyPairQuery());
        if (!keyResult.success || keyResult.data === undefined) {
            throw new Error('Failed to get identity key pair: ' + keyResult.errorMessage);
        }
        const keyPair = mapToSignalKeyPair(keyResult.data!);
        return keyPair;
    }

    public async getLocalRegistrationId(): Promise<number> {
        const result = await window.electron.sendRequestAsync<Result<number>>(new GetRegistrationIdQuery());
        if (!result.success || result.data === undefined) {
            throw new Error('Failed to get local registration ID: ' + result.errorMessage);
        }
        return result.data!;
    }

    public async isTrustedIdentity(
        identifier: string,
        identityKey: ArrayBuffer,
        _direction: libsignal.Direction,
    ): Promise<boolean> {
        const result = await window.electron.sendRequestAsync<Result<IdentityCacheDto>>(
            new GetIdentityCacheQuery(identifier),
        );

        if (!result.success) {
            throw new Error('Failed to get identity cache: ' + result.errorMessage);
        }

        const existing = result.data;
        if (!existing) {
            return true;
        }

        const keyMatch = Buffer.from(identityKey).equals(existing.identityKeyPublic);

        if (keyMatch) {
            return true;
        }

        return existing.isTrusted;
    }
}
