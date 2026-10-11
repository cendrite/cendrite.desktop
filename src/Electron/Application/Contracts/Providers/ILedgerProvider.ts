import { Result } from '../../../../Shared/Result/Result.js';

export class LedgerEvent {
    constructor(
        public readonly groupId: string,
        public readonly version: number,
        public readonly previousHash: Buffer,
        public readonly payload: Buffer,
        public readonly writeKeyPublic: Buffer,
        public readonly signature: Buffer,
        public readonly keysAdded: Buffer[],
        public readonly keysRemoved: Buffer[],
    ) { }
}

export interface LedgerEventDto {
    version: number;
    previousHash: string;
    payload: string;
    writeKeyPublic: string;
    signature: string;
    keysAdded: string[];
    keysRemoved: string[];
}

export interface LedgerEventsPageDto {
    version: number;
    archived: boolean;
    hasMore: boolean;
    events: LedgerEventDto[];
}

export interface LedgerHeadDto {
    version: number;
    hash: string;
    archived: boolean;
}

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

export class LedgerAppend {
    constructor(
        public readonly expectedVersion: number,
        public readonly previousHash: Buffer,
        public readonly payload: Buffer,
        public readonly writeKeyPublic: Buffer,
        public readonly signature: Buffer,
        public readonly keysAdded: Buffer[] = [],
        public readonly keysRemoved: Buffer[] = [],
    ) { }
}

export interface ILedgerProvider {
    createStream(groupId: string, payload: Buffer, writeKey: Buffer, keysAdded: Buffer[], signature: Buffer): Promise<Result<void>>;
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
