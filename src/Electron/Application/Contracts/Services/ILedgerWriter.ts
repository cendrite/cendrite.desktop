import { Result } from '../../../../Shared/Result/Result.js';
import { LedgerOperation } from '../../../Domain/Operations/LedgerOperation.js';

export interface ILedgerWriter {
    createStream(groupId: string, keys: Buffer[], operation: LedgerOperation): Promise<Result<void>>;
    append(groupId: string, operation: LedgerOperation): Promise<Result<void>>;
}
