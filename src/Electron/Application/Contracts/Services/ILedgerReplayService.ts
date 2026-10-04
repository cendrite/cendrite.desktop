import { GroupState } from '../../../Domain/Projections/GroupState.js';
import { LedgerEventRecord } from '../../../Domain/Entities/LedgerEventRecord.js';

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
    halted: HaltedEvent | null;
    stalledAt: number | null;
}

export interface ILedgerReplayService {
    replay(groupId: string, events: LedgerEventRecord[]): Promise<ReplayResult>;
}
