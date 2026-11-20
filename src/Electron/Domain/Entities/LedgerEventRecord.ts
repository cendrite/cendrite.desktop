import { LedgerEventStatus } from "../Enums/LedgerEventStatus.js";
import { KeyGrant } from "../Protocol/KeyChanges.js";

export class LedgerEventRecord {
    groupId: string;
    version: number;
    previousHash: Buffer;
    payload: Buffer;
    writeKeyPublic: Buffer;
    signature: Buffer;
    keysAdded: string[];
    invitesAdded: KeyGrant[];
    keysRemoved: string[];
    rolesChanged: KeyGrant[];
    hash: Buffer;
    status: LedgerEventStatus;
    rejectReason: string | null;
    verifiedAuthor: string | null;

    constructor(
        groupId: string,
        version: number,
        previousHash: Buffer,
        payload: Buffer,
        writeKeyPublic: Buffer,
        signature: Buffer,
        hash: Buffer,
        keysAdded: string[] = [],
        invitesAdded: KeyGrant[] = [],
        keysRemoved: string[] = [],
        rolesChanged: KeyGrant[] = [],
        status: LedgerEventStatus = LedgerEventStatus.Applied,
        rejectReason: string | null = null,
        verifiedAuthor: string | null = null,
    ) {
        this.groupId = groupId;
        this.version = version;
        this.previousHash = previousHash;
        this.payload = payload;
        this.writeKeyPublic = writeKeyPublic;
        this.signature = signature;
        this.hash = hash;
        this.keysAdded = keysAdded;
        this.invitesAdded = invitesAdded;
        this.keysRemoved = keysRemoved;
        this.rolesChanged = rolesChanged;
        this.status = status;
        this.rejectReason = rejectReason;
        this.verifiedAuthor = verifiedAuthor;
    }
}
