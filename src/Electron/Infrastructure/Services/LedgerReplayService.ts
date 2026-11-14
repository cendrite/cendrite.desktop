import {
    HaltedEvent,
    ILedgerReplayService,
    RejectedEvent,
    ReplayResult,
    VerifiedAuthor,
} from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { applyOperation, OperationContext, rejectReasonFor } from '#electron/Domain/Services/GroupReducer';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { LedgerEventRecord } from '#electron/Domain/Entities/LedgerEventRecord';
import { parseLedgerOperation, parseSignedLedgerOperation } from '#electron/Domain/Protocol/LedgerOperationParser';
import { IDeviceVerifier, VerifiedDevice } from '#electron/Application/Contracts/Services/IDeviceVerifier';
import {
    buildOperationSigningInput,
    buildSigningInput,
    decryptPayload,
    hashEvent,
    readEpoch,
    verifyOuter,
} from '../Crypto/LedgerCodec.js';
import { ILedgerIdentity } from '../Interfaces/ILedgerIdentity.js';

const UNVERIFIED = Symbol('unverified');

export class LedgerReplayService implements ILedgerReplayService {
    constructor(
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly ledgerIdentity: ILedgerIdentity,
        private readonly deviceVerifier: IDeviceVerifier,
    ) { }

    public async replay(groupId: string, events: LedgerEventRecord[]): Promise<ReplayResult> {
        const state = new GroupState(groupId);
        const rejected: RejectedEvent[] = [];
        const verified: VerifiedAuthor[] = [];
        const epochKeys = await this.epochKeys(groupId);

        for (const event of events) {
            const chainFailure = this.chainFailureFor(state, event);
            if (chainFailure) return this.halt(state, rejected, verified, { version: event.version, reason: chainFailure });

            const signingInput = buildSigningInput({
                groupId,
                version: event.version,
                previousHash: event.previousHash,
                payload: event.payload,
                keysAdded: event.keysAdded.map(fromBase64),
                invitesAdded: event.invitesAdded.map(fromBase64),
                keysRemoved: event.keysRemoved.map(fromBase64),
            });

            if (!verifyOuter(event.writeKeyPublic, signingInput, event.signature)) {
                return this.halt(state, rejected, verified, {
                    version: event.version,
                    reason: 'outer signature does not verify',
                });
            }

            const epochKey = epochKeys.get(readEpoch(event.payload));
            if (!epochKey) return { state, rejected, verified, halted: null, stalledAt: event.version };

            const reason = await this.applyIfValid(state, event, epochKey, verified);
            if (reason === UNVERIFIED) return { state, rejected, verified, halted: null, stalledAt: event.version };
            if (reason) rejected.push({ version: event.version, reason });

            // A rejected event still advances the chain: skipping its hash would break the next link.
            state.version = event.version;
            state.headHash = hashEvent(signingInput);
        }

        state.rejected = rejected.map((entry) => entry.version);

        return { state, rejected, verified, halted: null, stalledAt: null };
    }

    private async epochKeys(groupId: string): Promise<Map<number, Buffer>> {
        const keys = await this.groupKeyRepository.getEpochKeys(groupId);
        return new Map(keys.map((key) => [key.epoch, key.key]));
    }

    private halt(state: GroupState, rejected: RejectedEvent[], verified: VerifiedAuthor[], halted: HaltedEvent): ReplayResult {
        return { state, rejected, verified, halted, stalledAt: null };
    }

    private chainFailureFor(state: GroupState, event: LedgerEventRecord): string | null {
        if (event.version !== state.version + 1) return `expected version ${state.version + 1}, got ${event.version}`;
        if (!Buffer.from(event.previousHash).equals(state.headHash)) return 'previous hash does not match the head';
        return null;
    }

    private async applyIfValid(
        state: GroupState,
        event: LedgerEventRecord,
        epochKey: Buffer,
        verified: VerifiedAuthor[],
    ): Promise<string | typeof UNVERIFIED | null> {
        let plaintext: Buffer;

        try {
            plaintext = decryptPayload(epochKey, state.groupId, event.version, event.payload);
        } catch {
            return 'payload could not be decrypted or parsed';
        }

        const signed = parseSignedLedgerOperation(plaintext.toString('utf8'));
        if (!signed) return 'signed operation is malformed';

        const operationBytes = Buffer.from(signed.operation, 'base64');
        const operation = parseLedgerOperation(operationBytes.toString('utf8'));
        if (!operation) return 'operation is malformed';

        const identityKey = Buffer.from(signed.identityKey, 'base64');
        const operationInput = buildOperationSigningInput(state.groupId, event.version, operationBytes);

        if (!this.ledgerIdentity.verify(identityKey, operationInput, Buffer.from(signed.signature, 'base64'))) {
            return 'operation signature does not verify';
        }

        let authorTag = event.verifiedAuthor;

        if (authorTag === null) {
            let author: VerifiedDevice | null;

            try {
                author = await this.deviceVerifier.verify(signed.connectionId, signed.identityKey);
            } catch {
                return UNVERIFIED;
            }

            if (author) {
                authorTag = author.userTag;
                verified.push({ version: event.version, userTag: author.userTag });
            }
        }

        if (authorTag !== operation.authorTag) return 'the signing device does not belong to the author';

        const context: OperationContext = {
            version: event.version,
            authorKey: Buffer.from(event.writeKeyPublic).toString('base64'),
            keysAdded: event.keysAdded,
            invitesAdded: event.invitesAdded,
            keysRemoved: event.keysRemoved,
        };

        const reason = rejectReasonFor(state, operation, context);
        if (reason) return reason;

        applyOperation(state, operation, context);
        return null;
    }

}

function fromBase64(value: string): Buffer {
    return Buffer.from(value, 'base64');
}
