import { describe, expect, test } from 'vitest';
import { GetMembershipWarningQueryHandler } from '#electron/Application/Features/Groups/Queries/GetMembershipWarningQueryHandler';
import { GetMembershipWarningQuery } from '#shared/Groups/GetMembershipWarning';
import { MembershipWarning } from '#shared/Enums/MembershipWarning';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function setup(group: Group | null) {
    return new GetMembershipWarningQueryHandler({ get: async () => group } as never);
}

describe('the membership warning of a group', () => {
    test('returns the stored warning', async () => {
        const group = new Group(GROUP_ID, GroupLifecycle.Active);
        group.membershipWarning = MembershipWarning.Tampered;

        const result = await setup(group).handle(new GetMembershipWarningQuery(GROUP_ID));

        expect(result.data).toBe(MembershipWarning.Tampered);
    });

    test('returns no warning for an unknown group', async () => {
        const result = await setup(null).handle(new GetMembershipWarningQuery(GROUP_ID));

        expect(result.data).toBeNull();
    });
});
