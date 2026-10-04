import { ChatPrivileges } from '../Enums/ChatPrivileges.js';
import { GroupMember, GroupState } from './GroupState.js';
import { LedgerOperation } from './LedgerOperation.js';
import { LedgerOperationType } from './LedgerOperationType.js';

export interface OperationContext {
    version: number;
    authorKey: string;
    keysAdded: string[];
    keysRemoved: string[];
}

export function authorOf(state: GroupState, writeKeyPublic: string): GroupMember | null {
    return state.ownerOfWriteKey(writeKeyPublic);
}

/**
 * Every rule the server cannot enforce, because it never sees the operation. An author may only act
 * within the privilege the log itself granted them.
 */
export function rejectReasonFor(state: GroupState, operation: LedgerOperation, context: OperationContext): string | null {
    if (operation.type === LedgerOperationType.GroupCreated) {
        return context.version === 1 ? null : 'group creation is only valid as the first event';
    }

    const author = authorOf(state, context.authorKey);
    if (!author) return 'write key does not belong to a member';
    if (author.userTag !== operation.authorTag) return 'operation author does not match the signing key';

    const declaredKeys = declaredKeyChanges(state, operation);
    if (!sameKeys(declaredKeys.added, context.keysAdded)) return 'granted keys do not match the operation';
    if (!sameKeys(declaredKeys.removed, context.keysRemoved)) return 'revoked keys do not match the operation';

    switch (operation.type) {
        case LedgerOperationType.MemberAdded:
            if (state.members.has(operation.member.userTag)) return 'member is already in the group';
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

        case LedgerOperationType.WriteKeyRegistered: {
            const target = state.members.get(operation.userTag);
            if (!target) return 'member is not in the group';
            if (target.writeKeys.includes(operation.writeKeyPublic)) return 'write key is already registered';
            return null;
        }

        case LedgerOperationType.DeviceListPublished:
            return operation.userTag === author.userTag ? null : 'a member may only publish their own devices';
    }
}

export function applyOperation(state: GroupState, operation: LedgerOperation, context: OperationContext): void {
    switch (operation.type) {
        case LedgerOperationType.GroupCreated:
            state.name = operation.name;
            state.members.set(
                operation.owner.userTag,
                new GroupMember(
                    operation.owner.userTag,
                    operation.owner.displayName,
                    operation.owner.privilege,
                    operation.owner.identityKey,
                    context.version,
                    [context.authorKey],
                ),
            );
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
                    [operation.writeKeyPublic],
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

        case LedgerOperationType.WriteKeyRegistered:
            state.members.get(operation.userTag)!.writeKeys.push(operation.writeKeyPublic);
            break;

        case LedgerOperationType.DeviceListPublished:
            state.members.get(operation.userTag)!.connectionIds = [...operation.connectionIds];
            break;
    }
}

function requireAdmin(author: GroupMember): string | null {
    return author.privilege >= ChatPrivileges.Admin ? null : 'author is not an admin';
}

// The outer key changes the server applies must be exactly what the operation says it is doing,
// or an author could grant or revoke keys the operation never mentions.
function declaredKeyChanges(state: GroupState, operation: LedgerOperation): { added: string[]; removed: string[] } {
    switch (operation.type) {
        case LedgerOperationType.MemberAdded:
        case LedgerOperationType.WriteKeyRegistered:
            return { added: [operation.writeKeyPublic], removed: [] };

        case LedgerOperationType.MemberRemoved:
            return { added: [], removed: state.members.get(operation.userTag)?.writeKeys ?? [] };

        default:
            return { added: [], removed: [] };
    }
}

function sameKeys(declared: string[], applied: string[]): boolean {
    if (declared.length !== applied.length) return false;
    const sorted = [...applied].sort();
    return [...declared].sort().every((key, index) => key === sorted[index]);
}
