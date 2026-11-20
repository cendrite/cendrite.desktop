import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import {
    ILedgerProvider,
    isLedgerConflict,
    LedgerAppend,
    LedgerKeyGrant,
} from '#electron/Application/Contracts/Providers/ILedgerProvider';
import { ILedgerWriter, SealedCreate } from '#electron/Application/Contracts/Services/ILedgerWriter';
import { ITokenManager } from '#electron/Application/Contracts/Services/ITokenManager';
import { ILedgerSyncService } from '#electron/Application/Contracts/Services/ILedgerSyncService';
import { LEDGER_TOKEN_ORIGIN } from '#electron/Application/Contracts/Services/IBlindTokenService';
import { IPrivateTokenRepository } from '#electron/Application/Contracts/Repositories/IPrivateTokenRepository';
import { KeyChanges, KeyGrant } from '#electron/Domain/Protocol/KeyChanges';
import { LedgerOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { keyChangesFor } from '#electron/Domain/Services/GroupReducer';
import { buildOperationSigningInput, buildSigningInput, encryptPayload, hashEvent, signOuter } from '../Crypto/LedgerCodec.js';
import { ILedgerIdentity } from '../Interfaces/ILedgerIdentity.js';

const GENESIS_PREVIOUS_HASH = Buffer.alloc(32);
const MAX_ATTEMPTS = 5;

export class LedgerWriter implements ILedgerWriter {
    constructor(
        private readonly ledgerProvider: ILedgerProvider,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly ledgerSyncService: ILedgerSyncService,
        private readonly ledgerIdentity: ILedgerIdentity,
        private readonly privateTokenRepository: IPrivateTokenRepository,
        private readonly tokenManager: ITokenManager,
    ) { }

    public async sealCreate(groupId: string, operation: LedgerOperation): Promise<Result<SealedCreate>> {
        const keyChanges = keyChangesFor(new GroupState(groupId), operation);
        const sealed = await this.seal(groupId, 1, GENESIS_PREVIOUS_HASH, operation, keyChanges);
        if (!sealed.success) return Result.fail<SealedCreate>(sealed.errorMessage);

        const { payload, signature, hash } = sealed.data;

        return Result.success({ payload, signature, hash, invites: keyChanges.invites });
    }

    public async createStream(groupId: string, sealed: SealedCreate): Promise<Result<void>> {
        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey) return Result.fail(new ErrorMessage('LedgerWriter', `No write key for group ${groupId}`));

        const privateToken = await this.takePrivateToken();
        if (!privateToken) {
            return Result.fail(new ErrorMessage('LedgerWriter', 'No private token is available to create a group yet'));
        }

        const created = await this.ledgerProvider.createStream(
            groupId,
            sealed.payload,
            writeKey.publicKey,
            sealed.invites.map(toLedgerGrant),
            sealed.signature,
            privateToken,
        );

        if (created.success || !isLedgerConflict(created)) return created;

        return (await this.alreadyCreated(groupId, sealed.hash)) ? Result.success() : created;
    }

    public async append(groupId: string, operation: LedgerOperation): Promise<Result<void>> {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const synced = await this.ledgerSyncService.sync(groupId);
            if (!synced.success) return Result.fail(synced.errorMessage);

            const group = await this.groupRepository.get(groupId);
            if (!group) return Result.fail(new ErrorMessage('LedgerWriter', `Unknown group ${groupId}`));

            const version = group.version + 1;
            const keyChanges = keyChangesFor(synced.data.state, operation);

            const sealed = await this.seal(
                groupId,
                version,
                Buffer.from(group.headHash),
                operation,
                keyChanges,
            );
            if (!sealed.success) return Result.fail(sealed.errorMessage);

            const { payload, writeKey, signature } = sealed.data;

            const result = await this.ledgerProvider.appendEvent(
                groupId,
                new LedgerAppend(
                    group.version,
                    Buffer.from(group.headHash),
                    payload,
                    writeKey.publicKey,
                    signature,
                    keyChanges.added.map(fromBase64),
                    keyChanges.invites.map(toLedgerGrant),
                    keyChanges.removed.map(fromBase64),
                    keyChanges.roles.map(toLedgerGrant),
                ),
            );

            if (result.success || !isLedgerConflict(result)) return result;
        }

        return Result.fail(new ErrorMessage('LedgerWriter', 'Gave up appending after repeated conflicts.'));
    }

    private async takePrivateToken(): Promise<Buffer | null> {
        const privateToken = await this.privateTokenRepository.take(LEDGER_TOKEN_ORIGIN);
        if (privateToken) return privateToken;

        await this.tokenManager.refreshTokens();

        return await this.privateTokenRepository.take(LEDGER_TOKEN_ORIGIN);
    }

    private async alreadyCreated(groupId: string, hash: Buffer): Promise<boolean> {
        const synced = await this.ledgerSyncService.sync(groupId);

        return synced.success && synced.data.state.version === 1 && Buffer.from(synced.data.state.headHash).equals(hash);
    }

    private async seal(
        groupId: string,
        version: number,
        previousHash: Buffer,
        operation: LedgerOperation,
        keyChanges: KeyChanges,
    ): Promise<Result<SealedOperation>> {
        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey)
            return Result.fail<SealedOperation>(new ErrorMessage('LedgerWriter', `No write key for group ${groupId}`));

        const group = await this.groupRepository.get(groupId);
        const epoch = group?.epoch ?? 1;

        const epochKey = await this.groupKeyRepository.getEpochKey(groupId, epoch);
        if (!epochKey)
            return Result.fail<SealedOperation>(new ErrorMessage('LedgerWriter', `No epoch key for group ${groupId}`));

        const operationBytes = Buffer.from(JSON.stringify(operation), 'utf8');
        const wrapper = Buffer.from(
            JSON.stringify({
                operation: operationBytes.toString('base64'),
                identityKey: (await this.ledgerIdentity.publicKey()).toString('base64'),
                signature: (
                    await this.ledgerIdentity.sign(buildOperationSigningInput(groupId, version, operationBytes))
                ).toString('base64'),
                connectionId: await this.ledgerIdentity.connectionId(),
            }),
            'utf8',
        );

        const payload = encryptPayload(epochKey.key, epoch, groupId, version, wrapper);

        const signingInput = buildSigningInput({
            groupId,
            version,
            previousHash,
            payload,
            keysAdded: keyChanges.added.map(fromBase64),
            invitesAdded: keyChanges.invites.map(toLedgerGrant),
            keysRemoved: keyChanges.removed.map(fromBase64),
            rolesChanged: keyChanges.roles.map(toLedgerGrant),
        });
        const signature = signOuter(writeKey.privateKey, signingInput);

        return Result.success({ payload, writeKey, signature, hash: hashEvent(signingInput) });
    }
}

interface SealedOperation {
    payload: Buffer;
    hash: Buffer;
    writeKey: { publicKey: Buffer; privateKey: Buffer };
    signature: Buffer;
}

function toLedgerGrant(grant: KeyGrant): LedgerKeyGrant {
    return { publicKey: fromBase64(grant.publicKey), role: grant.role };
}

function fromBase64(value: string): Buffer {
    return Buffer.from(value, 'base64');
}
