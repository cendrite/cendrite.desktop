export const EPOCH_HEADER_BYTES = 4;
export const IV_BYTES = 12;
export const HASH_BYTES = 32;
export const WRITE_KEY_BYTES = 32;
export const SIGNATURE_BYTES = 64;

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
