import { describe, expect, test } from 'vitest';
import { ChatMember } from '../../../../../src/Electron/Domain/Entities/ChatMember.js';
import { Friend } from '../../../../../src/Electron/Domain/Aggregates/Friend.js';
import { FriendConnectionId } from '../../../../../src/Electron/Domain/Entities/FriendConnectionId.js';
import { ChatPrivileges } from '../../../../../src/Shared/Enums/ChatPrivileges.js';

function friend(): Friend {
    const f = new Friend();
    f.id = 'alice';
    f.username = 'alice';
    f.displayName = 'Alice';
    f.avatarKey = null;
    f.connectionIds = [new FriendConnectionId('device-a', f), new FriendConnectionId('device-b', f)];
    return f;
}

describe('a member created from a friend', () => {
    test('takes its tag and devices from the friend', () => {
        const member = ChatMember.create('m1', ChatPrivileges.Member, friend());

        expect(member.userTag).toBe('alice');
        expect(member.displayName).toBe('Alice');
        expect(member.devices).toEqual(['device-a', 'device-b']);
    });

    test('keeps its tag when the friend link is cleared', () => {
        const member = ChatMember.create('m1', ChatPrivileges.Member, friend());
        member.friend = null;

        expect(member.userTag).toBe('alice');
        expect(member.devices).toEqual([]);
    });
});

describe('a member who is not a friend', () => {
    test('carries its own tag, name and devices', () => {
        const member = ChatMember.createExternal('m2', ChatPrivileges.Member, 'carol', 'Carol', ['device-c']);

        expect(member.friend).toBeNull();
        expect(member.userTag).toBe('carol');
        expect(member.displayName).toBe('Carol');
        expect(member.devices).toEqual(['device-c']);
    });

    test('has no devices until the ledger says so', () => {
        const member = ChatMember.createExternal('m2', ChatPrivileges.Member, 'carol', 'Carol');

        expect(member.devices).toEqual([]);
    });
});
