import { Result } from '#shared/Result/Result';
import { LedgerOperation } from '#electron/Domain/Protocol/LedgerOperation';

export interface LedgerWrite {
    version: number;
    headHash: Buffer;
}

export interface ILedgerWriter {
    createStream(groupId: string, keys: Buffer[], operation: LedgerOperation): Promise<Result<LedgerWrite>>;
    append(groupId: string, operation: LedgerOperation): Promise<Result<LedgerWrite>>;
}
