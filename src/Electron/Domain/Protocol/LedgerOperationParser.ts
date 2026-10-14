import { ChatPrivileges } from '../../../Shared/Enums/ChatPrivileges.js';
import { LedgerOperationType } from '../Enums/LedgerOperationType.js';
import { GroupMemberRef, LedgerOperation, SignedLedgerOperation } from './LedgerOperation.js';

type Json = Record<string, unknown>;

export function parseSignedLedgerOperation(json: string): SignedLedgerOperation | null {
    const value = parseObject(json);
    if (!value) return null;

    const { operation, identityKey, signature } = value;
    if (typeof operation !== 'string' || typeof identityKey !== 'string' || typeof signature !== 'string') {
        return null;
    }

    return new SignedLedgerOperation(operation, identityKey, signature);
}

export function parseLedgerOperation(json: string): LedgerOperation | null {
    const value = parseObject(json);
    if (!value || typeof value.authorTag !== 'string' || !isNumber(value.at)) return null;

    switch (value.type) {
        case LedgerOperationType.GroupCreated:
            return (value.name === null || typeof value.name === 'string') &&
                isArrayOf(value.members, isMemberRef)
                ? (value as unknown as LedgerOperation)
                : null;
        case LedgerOperationType.MemberAdded:
            return isMemberRef(value.member) && typeof value.writeKeyPublic === 'string'
                ? (value as unknown as LedgerOperation)
                : null;
        case LedgerOperationType.MemberRemoved:
            return typeof value.userTag === 'string' ? (value as unknown as LedgerOperation) : null;
        case LedgerOperationType.PrivilegeChanged:
            return typeof value.userTag === 'string' && isPrivilege(value.privilege)
                ? (value as unknown as LedgerOperation)
                : null;
        case LedgerOperationType.SettingsChanged:
            return (value.name === null || typeof value.name === 'string') &&
                (value.messageTtl === null || isNumber(value.messageTtl))
                ? (value as unknown as LedgerOperation)
                : null;
        case LedgerOperationType.DeviceListPublished:
            return typeof value.userTag === 'string' && isArrayOf(value.connectionIds, isString)
                ? (value as unknown as LedgerOperation)
                : null;
        default:
            return null;
    }
}

function parseObject(json: string): Json | null {
    try {
        const value: unknown = JSON.parse(json);
        return isObject(value) ? value : null;
    } catch {
        return null;
    }
}

function isMemberRef(value: unknown): value is GroupMemberRef {
    return (
        isObject(value) &&
        typeof value.userTag === 'string' &&
        typeof value.displayName === 'string' &&
        isPrivilege(value.privilege) &&
        (value.avatarKey === null || typeof value.avatarKey === 'string') &&
        typeof value.identityKey === 'string' &&
        typeof value.writeKeyPublic === 'string' &&
        isArrayOf(value.connectionIds, isString)
    );
}

function isPrivilege(value: unknown): value is ChatPrivileges {
    return typeof value === 'number' && value in ChatPrivileges;
}

function isObject(value: unknown): value is Json {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
    return Array.isArray(value) && value.every(guard);
}
