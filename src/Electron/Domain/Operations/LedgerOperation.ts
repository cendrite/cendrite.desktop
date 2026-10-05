import { ChatPrivileges } from '../Enums/ChatPrivileges.js';
import { LedgerOperationType } from '../Enums/LedgerOperationType.js';

export interface GroupMemberRef {
    userTag: string;
    displayName: string;
    privilege: ChatPrivileges;
    identityKey: string;
    /** Minted by whoever adds the member, so joining costs no round trip. */
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
    name: string;
    members: GroupMemberRef[];
}

export interface MemberAddedOperation extends LedgerOperationBase {
    type: LedgerOperationType.MemberAdded;
    member: GroupMemberRef;
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

export interface WriteKeyRegisteredOperation extends LedgerOperationBase {
    type: LedgerOperationType.WriteKeyRegistered;
    userTag: string;
    writeKeyPublic: string;
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
    | WriteKeyRegisteredOperation
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
