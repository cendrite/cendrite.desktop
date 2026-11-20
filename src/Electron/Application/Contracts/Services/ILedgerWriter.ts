import { Result } from '#shared/Result/Result';
import { KeyGrant } from '#electron/Domain/Protocol/KeyChanges';
import { LedgerOperation } from '#electron/Domain/Protocol/LedgerOperation';

export interface SealedCreate {
    payload: Buffer;
    signature: Buffer;
    hash: Buffer;
    invites: KeyGrant[];
}

export interface ILedgerWriter {
    sealCreate(groupId: string, operation: LedgerOperation): Promise<Result<SealedCreate>>;
    createStream(groupId: string, sealed: SealedCreate): Promise<Result<void>>;
    append(groupId: string, operation: LedgerOperation): Promise<Result<void>>;
}
