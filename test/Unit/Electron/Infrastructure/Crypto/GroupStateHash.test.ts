import { createHash } from 'crypto';
import { describe, expect, test } from 'vitest';
import { groupStateHash } from '#electron/Infrastructure/Crypto/GroupStateHash';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function state(members: GroupMember[], name: string | null = 'Trip', messageTtl: number | null = null): GroupState {
    const s = new GroupState(GROUP_ID);
    s.version = 3;
    s.headHash = Buffer.alloc(32, 0x11);
    s.epoch = 1;
    s.name = name;
    s.messageTtl = messageTtl;
    for (const member of members) s.members.set(member.userTag, member);
    return s;
}

const alice = () => new GroupMember('alice', 'Alice', ChatPrivileges.Owner, 1, ['wk-a'], [], ['a-laptop', 'a-phone']);
const bob = () => new GroupMember('bob', 'Bob', ChatPrivileges.Member, 1, [], ['ik-b'], ['b-laptop']);

const u32 = (n: number) => {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(n);
    return b;
};
const txt = (v: string) => Buffer.concat([u32(Buffer.byteLength(v)), Buffer.from(v)]);
const list = (vs: string[]) => Buffer.concat([u32(vs.length), ...vs.map(txt)]);

describe('group state hash', () => {
    test('hashes the documented layout', () => {
        const expected = createHash('sha256')
            .update(
                Buffer.concat([
                    Buffer.from('group-state-v1'),
                    Buffer.from(GROUP_ID.replace(/-/g, ''), 'hex'),
                    u32(3),
                    Buffer.alloc(32, 0x11),
                    u32(1),
                    Buffer.from([1]),
                    txt('Trip'),
                    Buffer.from([0]),
                    u32(2),
                    txt('alice'),
                    Buffer.from([ChatPrivileges.Owner]),
                    list(['wk-a']),
                    list([]),
                    list(['a-laptop', 'a-phone']),
                    txt('bob'),
                    Buffer.from([ChatPrivileges.Member]),
                    list([]),
                    list(['ik-b']),
                    list(['b-laptop']),
                ]),
            )
            .digest();

        expect(groupStateHash(state([alice(), bob()]))).toEqual(expected);
    });

    test('does not depend on the order members or keys were added in', () => {
        const reordered = new GroupMember('alice', 'Alice', ChatPrivileges.Owner, 1, ['wk-a'], [], ['a-phone', 'a-laptop']);

        expect(groupStateHash(state([bob(), reordered]))).toEqual(groupStateHash(state([alice(), bob()])));
    });

    test('ignores display names, which are not membership', () => {
        const renamed = alice();
        renamed.displayName = 'Ali';

        expect(groupStateHash(state([renamed, bob()]))).toEqual(groupStateHash(state([alice(), bob()])));
    });

    test('changes with a privilege, a key or a device', () => {
        const base = groupStateHash(state([alice(), bob()]));

        const promoted = bob();
        promoted.privilege = ChatPrivileges.Admin;
        const swapped = bob();
        swapped.inviteKeys = [];
        swapped.writeKeys = ['wk-b'];
        const moved = bob();
        moved.connectionIds = ['b-phone'];

        for (const changed of [promoted, swapped, moved]) {
            expect(groupStateHash(state([alice(), changed]))).not.toEqual(base);
        }
    });

    test('tells no name and no TTL apart from empty values', () => {
        expect(groupStateHash(state([alice()], null))).not.toEqual(groupStateHash(state([alice()], '')));
        expect(groupStateHash(state([alice()], 'Trip', null))).not.toEqual(groupStateHash(state([alice()], 'Trip', 0)));
    });
});
