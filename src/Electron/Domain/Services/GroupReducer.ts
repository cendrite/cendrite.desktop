import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { LedgerOperationType } from '../Enums/LedgerOperationType.js';
import { WriteKeyRole } from '../Enums/WriteKeyRole.js';
import { GroupMember } from '../Projections/GroupMember.js';
import { GroupState } from '../Projections/GroupState.js';
import { KeyChanges, KeyGrant } from '../Protocol/KeyChanges.js';
import { LedgerOperation } from '../Protocol/LedgerOperation.js';

export interface OperationContext {
    version: number;
    authorKey: string;
    keysAdded: string[];
    invitesAdded: KeyGrant[];
    keysRemoved: string[];
    rolesChanged: KeyGrant[];
}

const NO_KEY_CHANGES: KeyChanges = { added: [], invites: [], removed: [], roles: [] };

export function authorOf(state: GroupState, writeKeyPublic: string): GroupMember | null {
    return state.ownerOfWriteKey(writeKeyPublic);
}

export function rejectReasonFor(
    state: GroupState,
    operation: LedgerOperation,
    context: OperationContext,
): string | null {
    if (operation.type === LedgerOperationType.GroupCreated) {
        if (context.version !== 1) return 'group creation is only valid as the first event';

        const writeKeys = operation.members.flatMap((member) => member.writeKeys);
        const creator = operation.members.find((member) => member.userTag === operation.authorTag);

        if (!creator?.writeKeys.includes(context.authorKey) || writeKeys.length !== 1) {
            return 'only the creating write key may be a write key at creation';
        }

        return keyChangeMismatch(keyChangesFor(state, operation), context);
    }

    const author = authorOf(state, context.authorKey);
    if (!author) return 'write key does not belong to a member';
    if (author.userTag !== operation.authorTag) return 'operation author does not match the signing key';
    const signedWithInvite = author.inviteKeys.includes(context.authorKey);
    if (signedWithInvite && operation.type !== LedgerOperationType.WriteKeyRegistered) {
        return 'an invite key may only register a write key';
    }

    const mismatch = keyChangeMismatch(keyChangesFor(state, operation), context);
    if (mismatch) return mismatch;

    switch (operation.type) {
        case LedgerOperationType.MemberAdded:
            if (state.members.has(operation.member.userTag)) return 'member is already in the group';
            if (operation.member.writeKeys.length > 0) return 'a new member may only be given invite keys';
            if (operation.member.privilege >= author.privilege) return 'author does not outrank the new member';
            return requireAdmin(author);

        case LedgerOperationType.MemberRemoved: {
            if (operation.userTag === author.userTag) return null;

            const target = state.members.get(operation.userTag);
            if (!target) return 'member is not in the group';
            if (author.privilege <= target.privilege) return 'author does not outrank the target';
            return requireAdmin(author);
        }

        case LedgerOperationType.PrivilegeChanged:
            if (!state.members.has(operation.userTag)) return 'member is not in the group';
            return author.privilege === ChatPrivileges.Owner ? null : 'only the owner may change privileges';

        case LedgerOperationType.SettingsChanged:
            return requireAdmin(author);

        case LedgerOperationType.DeviceListPublished:
            return operation.userTag === author.userTag ? null : 'a member may only publish their own devices';

        case LedgerOperationType.WriteKeyRegistered:
            if (!signedWithInvite || operation.inviteKeyPublic !== context.authorKey) {
                return 'only an invite key may be swapped, and only by itself';
            }
            if (state.ownerOfWriteKey(operation.writeKeyPublic)) return 'the new write key is already in use';
            return null;
    }
}

export function applyOperation(state: GroupState, operation: LedgerOperation, context: OperationContext): void {
    switch (operation.type) {
        case LedgerOperationType.GroupCreated:
            state.name = operation.name;

            for (const member of operation.members) {
                state.members.set(
                    member.userTag,
                    new GroupMember(
                        member.userTag,
                        member.displayName,
                        member.privilege,
                        context.version,
                        [...member.writeKeys],
                        [...member.inviteKeys],
                        member.connectionIds,
                    ),
                );
            }
            break;

        case LedgerOperationType.MemberAdded:
            state.removed.delete(operation.member.userTag);
            state.members.set(
                operation.member.userTag,
                new GroupMember(
                    operation.member.userTag,
                    operation.member.displayName,
                    operation.member.privilege,
                    context.version,
                    [],
                    [...operation.member.inviteKeys],
                    [...operation.member.connectionIds],
                ),
            );
            break;

        case LedgerOperationType.MemberRemoved:
            state.members.delete(operation.userTag);
            state.removed.add(operation.userTag);
            break;

        case LedgerOperationType.PrivilegeChanged:
            state.members.get(operation.userTag)!.privilege = operation.privilege;
            break;

        case LedgerOperationType.SettingsChanged:
            if (operation.name !== null) state.name = operation.name;
            if (operation.messageTtl !== null) state.messageTtl = operation.messageTtl;
            break;

        case LedgerOperationType.DeviceListPublished:
            state.members.get(operation.userTag)!.connectionIds = [...operation.connectionIds];
            break;

        case LedgerOperationType.WriteKeyRegistered: {
            const member = state.members.get(operation.authorTag)!;
            member.inviteKeys = member.inviteKeys.filter((key) => key !== operation.inviteKeyPublic);
            member.writeKeys = [...member.writeKeys, operation.writeKeyPublic];
            break;
        }
    }
}

function requireAdmin(author: GroupMember): string | null {
    return author.privilege >= ChatPrivileges.Admin ? null : 'author is not an admin';
}

export function roleFor(privilege: ChatPrivileges): WriteKeyRole {
    switch (privilege) {
        case ChatPrivileges.Owner:
            return WriteKeyRole.Owner;
        case ChatPrivileges.Admin:
            return WriteKeyRole.Admin;
        default:
            return WriteKeyRole.Writer;
    }
}

export function keyChangesFor(state: GroupState, operation: LedgerOperation): KeyChanges {
    switch (operation.type) {
        case LedgerOperationType.GroupCreated:
            return { ...NO_KEY_CHANGES, invites: operation.members.flatMap((member) => grants(member.inviteKeys, member.privilege)) };

        case LedgerOperationType.MemberAdded:
            return { ...NO_KEY_CHANGES, invites: grants(operation.member.inviteKeys, operation.member.privilege) };

        case LedgerOperationType.MemberRemoved: {
            const member = state.members.get(operation.userTag);
            return { ...NO_KEY_CHANGES, removed: member ? [...member.writeKeys, ...member.inviteKeys] : [] };
        }

        case LedgerOperationType.PrivilegeChanged: {
            const member = state.members.get(operation.userTag);
            return { ...NO_KEY_CHANGES, roles: member ? grants([...member.writeKeys, ...member.inviteKeys], operation.privilege) : [] };
        }

        case LedgerOperationType.WriteKeyRegistered:
            return { ...NO_KEY_CHANGES, added: [operation.writeKeyPublic], removed: [operation.inviteKeyPublic] };

        default:
            return NO_KEY_CHANGES;
    }
}

function grants(keys: string[], privilege: ChatPrivileges): KeyGrant[] {
    const role = roleFor(privilege);
    return keys.map((publicKey) => ({ publicKey, role }));
}

function keyChangeMismatch(declared: KeyChanges, context: OperationContext): string | null {
    if (!sameKeys(declared.added, context.keysAdded)) return 'granted keys do not match the operation';
    if (!sameKeys(declared.invites.map(grantText), context.invitesAdded.map(grantText))) return 'invited keys do not match the operation';
    if (!sameKeys(declared.removed, context.keysRemoved)) return 'revoked keys do not match the operation';
    if (!sameKeys(declared.roles.map(grantText), context.rolesChanged.map(grantText))) return 'role changes do not match the operation';
    return null;
}

function grantText(grant: KeyGrant): string {
    return `${grant.publicKey}:${grant.role}`;
}

function sameKeys(declared: string[], applied: string[]): boolean {
    if (declared.length !== applied.length) return false;
    const sorted = [...applied].sort();
    return [...declared].sort().every((key, index) => key === sorted[index]);
}
