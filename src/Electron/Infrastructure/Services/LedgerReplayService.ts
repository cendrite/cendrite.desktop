import {
    HaltedEvent,
    ILedgerReplayService,
    RejectedEvent,
    ReplayResult,
} from '../../Application/Contracts/Services/ILedgerReplayService.js';
import { IGroupKeyRepository } from '../../Application/Contracts/Repositories/IGroupKeyRepository.js';
import { applyOperation, OperationContext, rejectReasonFor } from '../../Domain/Services/GroupReducer.js';
import { GroupState } from '../../Domain/Projections/GroupState.js';
import { LedgerEventRecord } from '../../Domain/Entities/LedgerEventRecord.js';
import { LedgerOperation, SignedLedgerOperation } from '../../Domain/Operations/LedgerOperation.js';
import { LedgerOperationType } from '../../Domain/Enums/LedgerOperationType.js';
import {
    buildOperationSigningInput,
    buildSigningInput,
    decryptPayload,
    hashEvent,
    readEpoch,
    verifyOuter,
} from '../Crypto/LedgerCodec.js';
import { ILedgerIdentity } from '../Interfaces/ILedgerIdentity.js';

export class LedgerReplayService implements ILedgerReplayService {
    constructor(
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly ledgerIdentity: ILedgerIdentity,
    ) { }

    public async replay(groupId: string, events: LedgerEventRecord[]): Promise<ReplayResult> {
        const state = new GroupState(groupId);
        const rejected: RejectedEvent[] = [];
        const epochKeys = await this.epochKeys(groupId);

        for (const event of events) {
            const chainFailure = this.chainFailureFor(state, event);
            if (chainFailure) return this.halt(state, rejected, { version: event.version, reason: chainFailure });

            const signingInput = buildSigningInput({
                groupId,
                version: event.version,
                previousHash: event.previousHash,
                payload: event.payload,
                keysAdded: event.keysAdded.map(fromBase64),
                keysRemoved: event.keysRemoved.map(fromBase64),
            });

            if (!verifyOuter(event.writeKeyPublic, signingInput, event.signature)) {
                return this.halt(state, rejected, {
                    version: event.version,
                    reason: 'outer signature does not verify',
                });
            }

            const epochKey = epochKeys.get(readEpoch(event.payload));
            if (!epochKey) return { state, rejected, halted: null, stalledAt: event.version };

            const reason = this.applyIfValid(state, event, epochKey);
            if (reason) rejected.push({ version: event.version, reason });

            // A rejected event still advances the chain: skipping its hash would break the next link.
            state.version = event.version;
            state.headHash = hashEvent(signingInput);
        }

        state.rejected = rejected.map((entry) => entry.version);

        return { state, rejected, halted: null, stalledAt: null };
    }

    private async epochKeys(groupId: string): Promise<Map<number, Buffer>> {
        const keys = await this.groupKeyRepository.getEpochKeys(groupId);
        return new Map(keys.map((key) => [key.epoch, key.key]));
    }

    private halt(state: GroupState, rejected: RejectedEvent[], halted: HaltedEvent): ReplayResult {
        return { state, rejected, halted, stalledAt: null };
    }

    private chainFailureFor(state: GroupState, event: LedgerEventRecord): string | null {
        if (event.version !== state.version + 1) return `expected version ${state.version + 1}, got ${event.version}`;
        if (!Buffer.from(event.previousHash).equals(state.headHash)) return 'previous hash does not match the head';
        return null;
    }

    private applyIfValid(state: GroupState, event: LedgerEventRecord, epochKey: Buffer): string | null {
        let signed: SignedLedgerOperation;
        let operation: LedgerOperation;
        let operationBytes: Buffer;

        try {
            const plaintext = decryptPayload(epochKey, state.groupId, event.version, event.payload);
            signed = JSON.parse(plaintext.toString('utf8')) as SignedLedgerOperation;
            operationBytes = Buffer.from(signed.operation, 'base64');
            operation = JSON.parse(operationBytes.toString('utf8')) as LedgerOperation;
        } catch {
            return 'payload could not be decrypted or parsed';
        }

        const identityKey = Buffer.from(signed.identityKey, 'base64');
        const operationInput = buildOperationSigningInput(state.groupId, event.version, operationBytes);

        if (!this.ledgerIdentity.verify(identityKey, operationInput, Buffer.from(signed.signature, 'base64'))) {
            return 'operation signature does not verify';
        }

        const pinnedFailure = this.identityPinFailure(state, operation, signed.identityKey);
        if (pinnedFailure) return pinnedFailure;

        const context: OperationContext = {
            version: event.version,
            authorKey: Buffer.from(event.writeKeyPublic).toString('base64'),
            keysAdded: event.keysAdded,
            keysRemoved: event.keysRemoved,
        };

        const reason = rejectReasonFor(state, operation, context);
        if (reason) return reason;

        applyOperation(state, operation, context);
        return null;
    }

    /**
     * A member's identity key is pinned the moment they join, so a later operation cannot quietly claim
     * to be them under a different key.
     */
    private identityPinFailure(state: GroupState, operation: LedgerOperation, identityKey: string): string | null {
        if (operation.type === LedgerOperationType.GroupCreated) {
            const creator = operation.members.find((member) => member.userTag === operation.authorTag);

            return creator?.identityKey === identityKey
                ? null
                : 'creator identity key does not match the operation';
        }

        const author = state.members.get(operation.authorTag);
        if (!author) return null;

        // The creator may not have known a member's identity key, so an unpinned member pins on first use.
        if (!author.identityKey) {
            author.identityKey = identityKey;
            return null;
        }

        return author.identityKey === identityKey ? null : 'identity key does not match the one pinned for this member';
    }
}

function fromBase64(value: string): Buffer {
    return Buffer.from(value, 'base64');
}
