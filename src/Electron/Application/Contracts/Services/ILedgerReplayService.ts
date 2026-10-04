import { GroupState } from '../../../Domain/Ledger/GroupState.js';
import { LedgerEventRecord } from '../../../Domain/Ledger/LedgerEventRecord.js';

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

export interface ILedgerReplayService {
    replay(groupId: string, events: LedgerEventRecord[]): Promise<ReplayResult>;
}
