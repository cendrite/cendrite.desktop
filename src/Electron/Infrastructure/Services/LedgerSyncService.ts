import { Result } from '../../../Shared/Result/Result.js';
import { ILedgerProvider } from '../../Application/Contracts/Providers/ILedgerProvider.js';
import { IGroupRepository } from '../../Application/Contracts/Repositories/IGroupRepository.js';
import { ILedgerLogRepository } from '../../Application/Contracts/Repositories/ILedgerLogRepository.js';
import { ILedgerReplayService, ReplayResult } from '../../Application/Contracts/Services/ILedgerReplayService.js';
import { ILedgerSyncService } from '../../Application/Contracts/Services/ILedgerSyncService.js';
import { Group } from '../../Domain/Entities/Group.js';
import { LedgerEventRecord } from '../../Domain/Entities/LedgerEventRecord.js';
import { LedgerEventStatus } from '../../Domain/Enums/LedgerEventStatus.js';
import { buildSigningInput, hashEvent } from '../Crypto/LedgerCodec.js';

const PAGE_SIZE = 500;

export class LedgerSyncService implements ILedgerSyncService {
    constructor(
        private readonly ledgerProvider: ILedgerProvider,
        private readonly ledgerLogRepository: ILedgerLogRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly ledgerReplayService: ILedgerReplayService,
    ) { }

    public async sync(groupId: string): Promise<Result<ReplayResult>> {
        const fetched = await this.fetchNewEvents(groupId);
        if (!fetched.success) return Result.fail<ReplayResult>(fetched.errorMessage);

        const events = await this.ledgerLogRepository.getAll(groupId);
        const replayed = await this.ledgerReplayService.replay(groupId, events);

        await this.recordOutcome(groupId, replayed, fetched.data);

        return Result.success(replayed);
    }

    private async fetchNewEvents(groupId: string): Promise<Result<boolean>> {
        let fromVersion = (await this.ledgerLogRepository.getLastVersion(groupId)) + 1;
        let archived = false;
        let hasMore = true;

        while (hasMore) {
            const page = await this.ledgerProvider.getEvents(groupId, fromVersion, PAGE_SIZE);
            if (!page.success) return Result.fail<boolean>(page.errorMessage);

            const { events } = page.data;
            archived = page.data.archived;

            await this.ledgerLogRepository.append(events.map((event) => toRecord(groupId, event)));

            hasMore = page.data.hasMore && events.length > 0;

            if (hasMore) fromVersion = events[events.length - 1].version + 1;
        }

        return Result.success(archived);
    }

    private async recordOutcome(groupId: string, replayed: ReplayResult, archived: boolean): Promise<void> {
        const group = (await this.groupRepository.get(groupId)) ?? new Group(groupId);

        group.version = replayed.state.version;
        group.headHash = replayed.state.headHash;
        group.epoch = replayed.state.epoch;
        group.archived = archived;

        await this.groupRepository.create(group);

        for (const rejected of replayed.rejected) {
            await this.ledgerLogRepository.setStatus(
                groupId,
                rejected.version,
                LedgerEventStatus.Rejected,
                rejected.reason,
            );
        }

        if (replayed.stalledAt !== null) {
            await this.ledgerLogRepository.setStatus(groupId, replayed.stalledAt, LedgerEventStatus.Stalled);
        }
    }
}

function toRecord(groupId: string, event: { version: number; previousHash: Buffer; payload: Buffer; writeKeyPublic: Buffer; signature: Buffer; keysAdded: Buffer[]; keysRemoved: Buffer[] }): LedgerEventRecord {
    const hash = hashEvent(
        buildSigningInput({
            groupId,
            version: event.version,
            previousHash: event.previousHash,
            payload: event.payload,
            keysAdded: event.keysAdded,
            keysRemoved: event.keysRemoved,
        }),
    );

    return new LedgerEventRecord(
        groupId,
        event.version,
        event.previousHash,
        event.payload,
        event.writeKeyPublic,
        event.signature,
        hash,
        event.keysAdded.map((key) => key.toString('base64')),
        event.keysRemoved.map((key) => key.toString('base64')),
    );
}
