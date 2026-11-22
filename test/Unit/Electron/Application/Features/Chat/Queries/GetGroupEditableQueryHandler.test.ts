import { describe, expect, test } from 'vitest';
import { GetGroupEditableQueryHandler } from '#electron/Application/Features/Chat/Queries/GetGroupEditableQueryHandler';
import { GetGroupEditableQuery } from '#shared/Chat/GetGroupEditable';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function setup(group: Group | null, writeKey: GroupWriteKey | null) {
    return new GetGroupEditableQueryHandler(
        { get: async () => group } as never,
        { getWriteKey: async () => writeKey } as never,
    );
}

const key = (isInvite: boolean) => new GroupWriteKey(GROUP_ID, Buffer.alloc(32, 0xa1), Buffer.alloc(32, 0x42), isInvite);

describe('whether a group can be edited from this device', () => {
    test('can be edited once this device holds its own write key', async () => {
        const result = await setup(new Group(GROUP_ID, GroupLifecycle.Active), key(false)).handle(new GetGroupEditableQuery(GROUP_ID));

        expect(result.data).toBe(true);
    });

    test('cannot be edited while this device only holds an invite key', async () => {
        const result = await setup(new Group(GROUP_ID, GroupLifecycle.Active), key(true)).handle(new GetGroupEditableQuery(GROUP_ID));

        expect(result.data).toBe(false);
    });

    test('can be edited by its creator before the first message', async () => {
        const result = await setup(new Group(GROUP_ID, GroupLifecycle.Draft), key(false)).handle(new GetGroupEditableQuery(GROUP_ID));

        expect(result.data).toBe(true);
    });

    test('cannot be edited without a write key', async () => {
        const result = await setup(new Group(GROUP_ID, GroupLifecycle.Active), null).handle(new GetGroupEditableQuery(GROUP_ID));

        expect(result.data).toBe(false);
    });
});
