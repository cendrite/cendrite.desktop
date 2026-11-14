import { Result } from '#shared/Result/Result';
import { LedgerOperation } from '#electron/Domain/Protocol/LedgerOperation';

export interface ILedgerWriter {
    createStream(groupId: string, invites: Buffer[], operation: LedgerOperation): Promise<Result<Buffer>>;
    append(groupId: string, operation: LedgerOperation): Promise<Result<void>>;
}
