import { GroupState } from '../../Domain/Ledger/GroupState.js';
import { applyOperation, OperationContext, rejectReasonFor } from '../../Domain/Ledger/GroupReducer.js';
import { LedgerEventRecord } from '../../Domain/Ledger/LedgerEventRecord.js';
import { LedgerOperation, SignedLedgerOperation } from '../../Domain/Ledger/LedgerOperation.js';
import { LedgerOperationType } from '../../Domain/Ledger/LedgerOperationType.js';
import { buildOperationSigningInput, buildSigningInput, decryptPayload, hashEvent, readEpoch, verifyOuter } from './LedgerCodec.js';

export interface ReplayDependencies {
    epochKey(epoch: number): Buffer | null;
    verifyIdentitySignature(identityKey: Buffer, data: Buffer, signature: Buffer): boolean;
}

export interface RejectedEvent {
    version: number;
    reason: string;
}

export interface HaltedEvent {
    version: number;
    reason: string;
}

export interface ReplayResult {
    state: GroupState;
    rejected: RejectedEvent[];
    /** The server served something it could not have produced honestly; everything after it is untrusted. */
    halted: HaltedEvent | null;
    /** Replay stopped because an epoch key has not arrived yet, and can resume once it does. */
    stalledAt: number | null;
}

export function replay(groupId: string, events: LedgerEventRecord[], deps: ReplayDependencies): ReplayResult {
    const state = new GroupState(groupId);
    const rejected: RejectedEvent[] = [];

    for (const event of events) {
        const chainFailure = chainFailureFor(state, event);
        if (chainFailure) {
            return { state, rejected, halted: { version: event.version, reason: chainFailure }, stalledAt: null };
        }

        const signingInput = buildSigningInput({
            groupId,
            version: event.version,
            previousHash: event.previousHash,
            payload: event.payload,
            keysAdded: event.keysAdded.map(fromBase64),
            keysRemoved: event.keysRemoved.map(fromBase64),
        });

        if (!verifyOuter(event.writeKeyPublic, signingInput, event.signature)) {
            return {
                state,
                rejected,
                halted: { version: event.version, reason: 'outer signature does not verify' },
                stalledAt: null,
            };
        }

        const key = deps.epochKey(readEpoch(event.payload));
        if (!key) return { state, rejected, halted: null, stalledAt: event.version };

        const reason = applyIfValid(state, event, key, deps);
        if (reason) rejected.push({ version: event.version, reason });

        // A rejected event still advances the chain: skipping its hash would break the next link.
        state.version = event.version;
        state.headHash = hashEvent(signingInput);
    }

    state.rejected = rejected.map((entry) => entry.version);

    return { state, rejected, halted: null, stalledAt: null };
}

function chainFailureFor(state: GroupState, event: LedgerEventRecord): string | null {
    if (event.version !== state.version + 1) return `expected version ${state.version + 1}, got ${event.version}`;
    if (!event.previousHash.equals(state.headHash)) return 'previous hash does not match the head';
    return null;
}

function applyIfValid(
    state: GroupState,
    event: LedgerEventRecord,
    epochKey: Buffer,
    deps: ReplayDependencies,
): string | null {
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

    if (!deps.verifyIdentitySignature(identityKey, operationInput, Buffer.from(signed.signature, 'base64'))) {
        return 'operation signature does not verify';
    }

    const pinnedFailure = identityPinFailure(state, operation, signed.identityKey);
    if (pinnedFailure) return pinnedFailure;

    const context: OperationContext = {
        version: event.version,
        authorKey: event.writeKeyPublic.toString('base64'),
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
function identityPinFailure(state: GroupState, operation: LedgerOperation, identityKey: string): string | null {
    if (operation.type === LedgerOperationType.GroupCreated) {
        return operation.owner.identityKey === identityKey ? null : 'creator identity key does not match the operation';
    }

    const author = state.members.get(operation.authorTag);
    if (!author) return null;

    return author.identityKey === identityKey ? null : 'identity key does not match the one pinned for this member';
}

function fromBase64(value: string): Buffer {
    return Buffer.from(value, 'base64');
}
