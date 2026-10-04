import { Result } from '../../../../Shared/Result/Result.js';
import { LedgerAppend, LedgerEvent } from '../../../Domain/Ledger/LedgerEvent.js';

export interface LedgerEventsPage {
    version: number;
    archived: boolean;
    hasMore: boolean;
    events: LedgerEvent[];
}

export interface LedgerHead {
    version: number;
    hash: Buffer;
    archived: boolean;
}

export interface ILedgerProvider {
    createStream(groupId: string, payload: Buffer, writeKey: Buffer, signature: Buffer): Promise<Result<void>>;
    appendEvent(groupId: string, append: LedgerAppend): Promise<Result<void>>;
    archiveStream(groupId: string, append: LedgerAppend): Promise<Result<void>>;
    getEvents(groupId: string, fromVersion: number, limit?: number): Promise<Result<LedgerEventsPage>>;
    getHead(groupId: string): Promise<Result<LedgerHead>>;
}

/**
 * The gateway maps a result's error to problem details, where the title carries the kind. The HTTP
 * status never reaches the caller, so a conflict is recognised by that title.
 */
export function isLedgerConflict(result: Result<unknown>): boolean {
    return !result.success && result.errorMessage?.code === 'Conflict';
}
