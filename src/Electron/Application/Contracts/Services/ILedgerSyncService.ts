import { Result } from '../../../../Shared/Result/Result.js';
import { ReplayResult } from './ILedgerReplayService.js';

export interface ILedgerSyncService {
    /** Fetches anything new, stores it, and replays the whole log into group state. */
    sync(groupId: string): Promise<Result<ReplayResult>>;
}
