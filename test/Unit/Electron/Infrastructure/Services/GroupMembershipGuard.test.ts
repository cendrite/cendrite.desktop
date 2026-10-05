import { describe, expect, test } from 'vitest';
import { GroupMembershipGuard } from '../../../../../src/Electron/Infrastructure/Services/GroupMembershipGuard.js';
import { ILedgerLogRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/ILedgerLogRepository.js';
import { ILedgerReplayService } from '../../../../../src/Electron/Application/Contracts/Services/ILedgerReplayService.js';
import { LedgerEventRecord } from '../../../../../src/Electron/Domain/Entities/LedgerEventRecord.js';
import { GroupMember } from '../../../../../src/Electron/Domain/Projections/GroupMember.js';
import { GroupState } from '../../../../../src/Electron/Domain/Projections/GroupState.js';
import { ChatPrivileges } from '../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function guard(members: { tag: string; devices: string[] }[], hasEvents = true) {
    const state = new GroupState(GROUP_ID);
    for (const member of members) {
        state.members.set(
            member.tag,
            new GroupMember(member.tag, member.tag, ChatPrivileges.Member, 'id', 1, [], member.devices),
        );
    }

    const log = {
        getAll: async () =>
            hasEvents
                ? [new LedgerEventRecord(GROUP_ID, 1, Buffer.alloc(32), Buffer.from([1]), Buffer.alloc(32), Buffer.alloc(64), Buffer.alloc(32))]
                : [],
    } as unknown as ILedgerLogRepository;

    const replay = {
        replay: async () => ({ state, rejected: [], halted: null, stalledAt: null }),
    } as unknown as ILedgerReplayService;

    return new GroupMembershipGuard(log, replay);
}

describe('the membership guard', () => {
    test('accepts a device the ledger lists', async () => {
        const sut = guard([{ tag: 'bob', devices: ['bob-device'] }]);

        expect(await sut.isMember(GROUP_ID, 'bob-device')).toBe(true);
    });

    test('rejects a device belonging to nobody in the group', async () => {
        const sut = guard([{ tag: 'bob', devices: ['bob-device'] }]);

        expect(await sut.isMember(GROUP_ID, 'carol-device')).toBe(false);
    });

    test('rejects everyone when there is no log yet', async () => {
        const sut = guard([{ tag: 'bob', devices: ['bob-device'] }], false);

        expect(await sut.isMember(GROUP_ID, 'bob-device')).toBe(false);
    });
});
