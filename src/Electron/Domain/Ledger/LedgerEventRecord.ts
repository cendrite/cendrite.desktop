import { LedgerEventStatus } from './LedgerEventStatus.js';

export class LedgerEventRecord {
    groupId: string;
    version: number;
    previousHash: Buffer;
    payload: Buffer;
    writeKeyPublic: Buffer;
    signature: Buffer;
    keysAdded: string[];
    keysRemoved: string[];
    hash: Buffer;
    status: LedgerEventStatus;
    rejectReason: string | null;

    constructor(
        groupId: string,
        version: number,
        previousHash: Buffer,
        payload: Buffer,
        writeKeyPublic: Buffer,
        signature: Buffer,
        hash: Buffer,
        keysAdded: string[] = [],
        keysRemoved: string[] = [],
        status: LedgerEventStatus = LedgerEventStatus.Applied,
        rejectReason: string | null = null,
    ) {
        this.groupId = groupId;
        this.version = version;
        this.previousHash = previousHash;
        this.payload = payload;
        this.writeKeyPublic = writeKeyPublic;
        this.signature = signature;
        this.hash = hash;
        this.keysAdded = keysAdded;
        this.keysRemoved = keysRemoved;
        this.status = status;
        this.rejectReason = rejectReason;
    }
}
