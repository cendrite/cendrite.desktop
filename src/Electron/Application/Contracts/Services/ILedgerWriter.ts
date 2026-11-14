import { Result } from '#shared/Result/Result';
import { LedgerOperation } from '#electron/Domain/Protocol/LedgerOperation';

export interface SealedCreate {
    payload: Buffer;
    signature: Buffer;
    hash: Buffer;
}

export interface ILedgerWriter {
    sealCreate(groupId: string, invites: Buffer[], operation: LedgerOperation): Promise<Result<SealedCreate>>;
    createStream(groupId: string, invites: Buffer[], sealed: SealedCreate): Promise<Result<void>>;
    append(groupId: string, operation: LedgerOperation): Promise<Result<void>>;
}
