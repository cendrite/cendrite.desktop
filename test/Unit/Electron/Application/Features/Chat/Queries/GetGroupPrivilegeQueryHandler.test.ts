import { describe, expect, test } from 'vitest';
import { GetGroupPrivilegeQueryHandler } from '#electron/Application/Features/Chat/Queries/GetGroupPrivilegeQueryHandler';
import { GetGroupPrivilegeQuery } from '#shared/Chat/GetGroupPrivilege';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function privilegeOf(group: Group | null, writeKey: GroupWriteKey | null) {
    return new GetGroupPrivilegeQueryHandler(
        { get: async () => group } as never,
        { getWriteKey: async () => writeKey } as never,
    ).handle(new GetGroupPrivilegeQuery(GROUP_ID));
}

const active = (privilege: ChatPrivileges) => Object.assign(new Group(GROUP_ID, GroupLifecycle.Active), { privilege });
const key = (isInvite: boolean) => new GroupWriteKey(GROUP_ID, Buffer.alloc(32, 0xa1), Buffer.alloc(32, 0x42), isInvite);

describe('the privilege of this device in a group', () => {
    test.each([ChatPrivileges.Member, ChatPrivileges.Admin, ChatPrivileges.Owner])('returns stored privilege %s', async (privilege) => {
        expect((await privilegeOf(active(privilege), key(false))).data).toBe(privilege);
    });

    test('the creator owns a group before its first message', async () => {
        expect((await privilegeOf(new Group(GROUP_ID, GroupLifecycle.Draft), key(false))).data).toBe(ChatPrivileges.Owner);
    });

    test('has no privilege while only holding an invite key', async () => {
        expect((await privilegeOf(active(ChatPrivileges.Admin), key(true))).data).toBe(ChatPrivileges.None);
    });

    test('has no privilege without a write key', async () => {
        expect((await privilegeOf(active(ChatPrivileges.Owner), null)).data).toBe(ChatPrivileges.None);
    });

    test('has no privilege in an unknown group', async () => {
        expect((await privilegeOf(null, key(false))).data).toBe(ChatPrivileges.None);
    });
});
