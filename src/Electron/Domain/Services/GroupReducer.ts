import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { LedgerOperationType } from '../Enums/LedgerOperationType.js';
import { GroupMember } from '../Projections/GroupMember.js';
import { GroupState } from '../Projections/GroupState.js';
import { LedgerOperation } from '../Protocol/LedgerOperation.js';

export interface OperationContext {
    version: number;
    authorKey: string;
    keysAdded: string[];
    invitesAdded: string[];
    keysRemoved: string[];
}

interface KeyChanges {
    added: string[];
    invites: string[];
    removed: string[];
}

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

        return keyChangeMismatch(declaredKeyChanges(state, operation), context);
    }

    const author = authorOf(state, context.authorKey);
    if (!author) return 'write key does not belong to a member';
    if (author.userTag !== operation.authorTag) return 'operation author does not match the signing key';
    if (author.inviteKeys.includes(context.authorKey)) return 'an invite key may only register a write key';

    const mismatch = keyChangeMismatch(declaredKeyChanges(state, operation), context);
    if (mismatch) return mismatch;

    switch (operation.type) {
        case LedgerOperationType.MemberAdded:
            if (state.members.has(operation.member.userTag)) return 'member is already in the group';
            if (operation.member.writeKeys.length > 0) return 'a new member may only be given invite keys';
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
                        member.identityKey,
                        context.version,
                        [...member.writeKeys],
                        [...member.inviteKeys],
                        member.connectionIds,
                    ),
                );
            }
            break;

        case LedgerOperationType.MemberAdded:
            state.members.set(
                operation.member.userTag,
                new GroupMember(
                    operation.member.userTag,
                    operation.member.displayName,
                    operation.member.privilege,
                    operation.member.identityKey,
                    context.version,
                    [],
                    [...operation.member.inviteKeys],
                ),
            );
            break;

        case LedgerOperationType.MemberRemoved:
            state.members.delete(operation.userTag);
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
    }
}

function requireAdmin(author: GroupMember): string | null {
    return author.privilege >= ChatPrivileges.Admin ? null : 'author is not an admin';
}

function declaredKeyChanges(state: GroupState, operation: LedgerOperation): KeyChanges {
    switch (operation.type) {
        case LedgerOperationType.GroupCreated:
            return { added: [], invites: operation.members.flatMap((member) => member.inviteKeys), removed: [] };

        case LedgerOperationType.MemberAdded:
            return { added: [], invites: operation.member.inviteKeys, removed: [] };

        case LedgerOperationType.MemberRemoved: {
            const member = state.members.get(operation.userTag);
            return { added: [], invites: [], removed: member ? [...member.writeKeys, ...member.inviteKeys] : [] };
        }

        default:
            return { added: [], invites: [], removed: [] };
    }
}

function keyChangeMismatch(declared: KeyChanges, context: OperationContext): string | null {
    if (!sameKeys(declared.added, context.keysAdded)) return 'granted keys do not match the operation';
    if (!sameKeys(declared.invites, context.invitesAdded)) return 'invited keys do not match the operation';
    if (!sameKeys(declared.removed, context.keysRemoved)) return 'revoked keys do not match the operation';
    return null;
}

function sameKeys(declared: string[], applied: string[]): boolean {
    if (declared.length !== applied.length) return false;
    const sorted = [...applied].sort();
    return [...declared].sort().every((key, index) => key === sorted[index]);
}
