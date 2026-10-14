import { LedgerEventRecord } from '#electron/Domain/Entities/LedgerEventRecord';
import { LedgerEventStatus } from '#electron/Domain/Enums/LedgerEventStatus';

export interface ILedgerLogRepository {
    append(records: LedgerEventRecord[]): Promise<void>;
    getFrom(groupId: string, fromVersion: number): Promise<LedgerEventRecord[]>;
    getAll(groupId: string): Promise<LedgerEventRecord[]>;
    getLastVersion(groupId: string): Promise<number>;
    setStatus(groupId: string, version: number, status: LedgerEventStatus, rejectReason?: string | null): Promise<void>;
    deleteAll(): Promise<void>;
}
