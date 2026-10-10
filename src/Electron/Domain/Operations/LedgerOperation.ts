import { ChatPrivileges } from '../Enums/ChatPrivileges.js';
import { LedgerOperationType } from '../Enums/LedgerOperationType.js';

export interface GroupMemberRef {
    userTag: string;
    displayName: string;
    privilege: ChatPrivileges;
    identityKey: string;
    writeKeyPublic: string;
    connectionIds: string[];
}

interface LedgerOperationBase {
    type: LedgerOperationType;
    authorTag: string;
    at: number;
}

export interface GroupCreatedOperation extends LedgerOperationBase {
    type: LedgerOperationType.GroupCreated;
    authorTag: string;
    name: string | null;
    owner: GroupMemberRef;
}

export interface MemberAddedOperation extends LedgerOperationBase {
    type: LedgerOperationType.MemberAdded;
    member: GroupMemberRef;
    writeKeyPublic: string;
}

export interface MemberRemovedOperation extends LedgerOperationBase {
    type: LedgerOperationType.MemberRemoved;
    userTag: string;
}

export interface PrivilegeChangedOperation extends LedgerOperationBase {
    type: LedgerOperationType.PrivilegeChanged;
    userTag: string;
    privilege: ChatPrivileges;
}

export interface SettingsChangedOperation extends LedgerOperationBase {
    type: LedgerOperationType.SettingsChanged;
    name: string | null;
    messageTtl: number | null;
}

export interface DeviceListPublishedOperation extends LedgerOperationBase {
    type: LedgerOperationType.DeviceListPublished;
    userTag: string;
    connectionIds: string[];
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
export interface SignedLedgerOperation {
    operation: string;
    identityKey: string;
    signature: string;
}
