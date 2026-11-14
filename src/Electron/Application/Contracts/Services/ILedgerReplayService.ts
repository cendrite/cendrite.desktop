import { GroupState } from '#electron/Domain/Projections/GroupState';
import { LedgerEventRecord } from '#electron/Domain/Entities/LedgerEventRecord';

export interface RejectedEvent {
    version: number;
    reason: string;
}

export interface HaltedEvent {
    version: number;
    reason: string;
}

export interface VerifiedAuthor {
    version: number;
    userTag: string;
}

export interface ReplayResult {
    state: GroupState;
    rejected: RejectedEvent[];
    verified: VerifiedAuthor[];
    halted: HaltedEvent | null;
    stalledAt: number | null;
}

export interface ILedgerReplayService {
    replay(groupId: string, events: LedgerEventRecord[]): Promise<ReplayResult>;
}
