import { Result } from '../../../Shared/Result/Result.js';
import { ErrorMessage } from '../../../Shared/Result/ErrorMessage.js';
import { IGroupKeyRepository } from '../../Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../Application/Contracts/Repositories/IGroupRepository.js';
import {
    ILedgerProvider,
    isLedgerConflict,
    LedgerAppend,
} from '../../Application/Contracts/Providers/ILedgerProvider.js';
import { ILedgerWriter } from '../../Application/Contracts/Services/ILedgerWriter.js';
import { ILedgerSyncService } from '../../Application/Contracts/Services/ILedgerSyncService.js';
import { LedgerOperationType } from '../../Domain/Enums/LedgerOperationType.js';
import { LedgerOperation } from '../../Domain/Operations/LedgerOperation.js';
import { GroupState } from '../../Domain/Projections/GroupState.js';
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
    ) { }

    public async createStream(groupId: string, keys: Buffer[], operation: LedgerOperation): Promise<Result<Buffer>> {
        const sealed = await this.seal(groupId, 1, GENESIS_PREVIOUS_HASH, operation, keys, []);
        if (!sealed.success) return Result.fail<Buffer>(sealed.errorMessage!);

        const { payload, writeKey, signature, hash } = sealed.data!;

        const created = await this.ledgerProvider.createStream(groupId, payload, writeKey.publicKey, keys, signature);

        return created.success ? Result.success(hash) : Result.fail<Buffer>(created.errorMessage!);
    }

    public async append(groupId: string, operation: LedgerOperation): Promise<Result<void>> {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const synced = await this.ledgerSyncService.sync(groupId);
            if (!synced.success) return Result.fail(synced.errorMessage!);

            const group = await this.groupRepository.get(groupId);
            if (!group) return Result.fail(new ErrorMessage('LedgerWriter', `Unknown group ${groupId}`));

            const version = group.version + 1;
            const keyChanges = keyChangesFor(operation, synced.data!.state);

            const sealed = await this.seal(
                groupId,
                version,
                Buffer.from(group.headHash),
                operation,
                keyChanges.added,
                keyChanges.removed,
            );
            if (!sealed.success) return Result.fail(sealed.errorMessage!);

            const { payload, writeKey, signature } = sealed.data!;

            const result = await this.ledgerProvider.appendEvent(
                groupId,
                new LedgerAppend(
                    group.version,
                    Buffer.from(group.headHash),
                    payload,
                    writeKey.publicKey,
                    signature,
                    keyChanges.added,
                    keyChanges.removed,
                ),
            );

            if (result.success || !isLedgerConflict(result)) return result;
        }

        return Result.fail(new ErrorMessage('LedgerWriter', 'Gave up appending after repeated conflicts.'));
    }

    private async seal(
        groupId: string,
        version: number,
        previousHash: Buffer,
        operation: LedgerOperation,
        keysAdded: Buffer[],
        keysRemoved: Buffer[],
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
            }),
            'utf8',
        );

        const payload = encryptPayload(epochKey.key, epoch, groupId, version, wrapper);

        const signingInput = buildSigningInput({ groupId, version, previousHash, payload, keysAdded, keysRemoved });
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

function keyChangesFor(operation: LedgerOperation, state: GroupState): { added: Buffer[]; removed: Buffer[] } {
    switch (operation.type) {
        case LedgerOperationType.MemberAdded:
            return { added: [Buffer.from(operation.writeKeyPublic, 'base64')], removed: [] };

        case LedgerOperationType.MemberRemoved:
            return {
                added: [],
                removed: (state.members.get(operation.userTag)?.writeKeys ?? []).map((key) =>
                    Buffer.from(key, 'base64'),
                ),
            };

        default:
            return { added: [], removed: [] };
    }
}
