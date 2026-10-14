import { ChatPrivileges } from '../../../Shared/Enums/ChatPrivileges.js';
import { LedgerOperationType } from '../Enums/LedgerOperationType.js';

export class GroupMemberRef {
    constructor(
        public readonly userTag: string,
        public readonly displayName: string,
        public readonly privilege: ChatPrivileges,
        public readonly avatarKey: string | null,
        public readonly identityKey: string,
        public readonly writeKeyPublic: string,
        public readonly connectionIds: string[],
    ) { }
}

export abstract class LedgerOperationBase {
    abstract readonly type: LedgerOperationType;

    constructor(
        public readonly authorTag: string,
        public readonly at: number = Date.now(),
    ) { }
}

export class GroupCreatedOperation extends LedgerOperationBase {
    readonly type = LedgerOperationType.GroupCreated;

    constructor(
        authorTag: string,
        public readonly name: string | null,
        public readonly members: GroupMemberRef[],
        at?: number,
    ) {
        super(authorTag, at);
    }
}

export class MemberAddedOperation extends LedgerOperationBase {
    readonly type = LedgerOperationType.MemberAdded;

    constructor(
        authorTag: string,
        public readonly member: GroupMemberRef,
        public readonly writeKeyPublic: string,
        at?: number,
    ) {
        super(authorTag, at);
    }
}

export class MemberRemovedOperation extends LedgerOperationBase {
    readonly type = LedgerOperationType.MemberRemoved;

    constructor(
        authorTag: string,
        public readonly userTag: string,
        at?: number,
    ) {
        super(authorTag, at);
    }
}

export class PrivilegeChangedOperation extends LedgerOperationBase {
    readonly type = LedgerOperationType.PrivilegeChanged;

    constructor(
        authorTag: string,
        public readonly userTag: string,
        public readonly privilege: ChatPrivileges,
        at?: number,
    ) {
        super(authorTag, at);
    }
}

export class SettingsChangedOperation extends LedgerOperationBase {
    readonly type = LedgerOperationType.SettingsChanged;

    constructor(
        authorTag: string,
        public readonly name: string | null,
        public readonly messageTtl: number | null,
        at?: number,
    ) {
        super(authorTag, at);
    }
}

export class DeviceListPublishedOperation extends LedgerOperationBase {
    readonly type = LedgerOperationType.DeviceListPublished;

    constructor(
        authorTag: string,
        public readonly userTag: string,
        public readonly connectionIds: string[],
        at?: number,
    ) {
        super(authorTag, at);
    }
}

export type LedgerOperation =
    | GroupCreatedOperation
    | MemberAddedOperation
    | MemberRemovedOperation
    | PrivilegeChangedOperation
    | SettingsChangedOperation
    | DeviceListPublishedOperation;

/**
 * The operation is kept as the exact bytes that were signed, so a receiver verifies what it decrypted
 * rather than a re-serialisation of it.
 */
export class SignedLedgerOperation {
    constructor(
        public readonly operation: string,
        public readonly identityKey: string,
        public readonly signature: string,
    ) { }
}
