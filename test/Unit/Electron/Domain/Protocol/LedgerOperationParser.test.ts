import { describe, expect, it } from 'vitest';
import {
    parseLedgerOperation,
    parseSignedLedgerOperation,
} from '../../../../../src/Electron/Domain/Protocol/LedgerOperationParser.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';

const member = {
    userTag: 'alice',
    displayName: 'Alice',
    privilege: 3,
    avatarKey: null,
    identityKey: 'aWQ=',
    writeKeyPublic: 'd2s=',
    connectionIds: ['c1'],
};

const base = { authorTag: 'alice', at: 1 };

describe('parseSignedLedgerOperation', () => {
    it('accepts the three string fields', () => {
        const result = parseSignedLedgerOperation(
            JSON.stringify({ operation: 'b3A=', identityKey: 'aWQ=', signature: 'c2ln' }),
        );

        expect(result?.signature).toBe('c2ln');
    });

    it.each([
        ['not json', 'nope'],
        ['an array', '[]'],
        ['null', 'null'],
        ['a missing signature', JSON.stringify({ operation: 'a', identityKey: 'b' })],
        ['a non-string field', JSON.stringify({ operation: 1, identityKey: 'b', signature: 'c' })],
    ])('rejects %s', (_, json) => {
        expect(parseSignedLedgerOperation(json)).toBeNull();
    });
});

describe('parseLedgerOperation', () => {
    it('accepts a well-formed group creation', () => {
        const json = JSON.stringify({ ...base, type: LedgerOperationType.GroupCreated, name: 'g', members: [member] });

        expect(parseLedgerOperation(json)?.type).toBe(LedgerOperationType.GroupCreated);
    });

    it('accepts a device list', () => {
        const json = JSON.stringify({
            ...base,
            type: LedgerOperationType.DeviceListPublished,
            userTag: 'alice',
            connectionIds: ['c1'],
        });

        expect(parseLedgerOperation(json)?.type).toBe(LedgerOperationType.DeviceListPublished);
    });

    it('rejects an unknown operation type', () => {
        expect(parseLedgerOperation(JSON.stringify({ ...base, type: 99 }))).toBeNull();
    });

    it('rejects a type without an operation class', () => {
        expect(
            parseLedgerOperation(JSON.stringify({ ...base, type: LedgerOperationType.WriteKeyRegistered })),
        ).toBeNull();
    });

    it('rejects a group creation whose members are not an array', () => {
        const json = JSON.stringify({ ...base, type: LedgerOperationType.GroupCreated, name: null, members: {} });

        expect(parseLedgerOperation(json)).toBeNull();
    });

    it('rejects a member with an out-of-range privilege', () => {
        const json = JSON.stringify({
            ...base,
            type: LedgerOperationType.MemberAdded,
            member: { ...member, privilege: 42 },
            writeKeyPublic: 'a',
        });

        expect(parseLedgerOperation(json)).toBeNull();
    });

    it('rejects a missing author', () => {
        const json = JSON.stringify({ type: LedgerOperationType.MemberRemoved, userTag: 'bob', at: 1 });

        expect(parseLedgerOperation(json)).toBeNull();
    });
});
