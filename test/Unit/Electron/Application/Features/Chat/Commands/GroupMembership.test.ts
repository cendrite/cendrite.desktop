import { describe, expect, test } from 'vitest';
import { RemoveGroupMemberCommandHandler } from '../../../../../../../src/Electron/Application/Features/Chat/Commands/RemoveGroupMemberCommandHandler.js';
import { RemoveGroupMemberCommand } from '../../../../../../../src/Electron/Application/Features/Chat/Contracts/GroupMembership.js';
import { IEventRepository } from '../../../../../../../src/Electron/Application/Contracts/Providers/IEventRepository.js';
import { IGroupRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IUserRepository.js';
import { ILedgerSyncService } from '../../../../../../../src/Electron/Application/Contracts/Services/ILedgerSyncService.js';
import { IPump } from '../../../../../../../src/Electron/Application/Contracts/Services/IPump.js';
import { LedgerOperationType } from '../../../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { ChatPrivileges } from '../../../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';
import { LedgerOperationQueuedEvent } from '../../../../../../../src/Electron/Domain/Events/LedgerOperationQueuedEvent.js';
import { DomainEvent } from '../../../../../../../src/Electron/Domain/Events/IDomainEvent.js';
import { GroupMember } from '../../../../../../../src/Electron/Domain/Projections/GroupMember.js';
import { GroupState } from '../../../../../../../src/Electron/Domain/Projections/GroupState.js';
import { User } from '../../../../../../../src/Electron/Domain/Aggregates/User.js';
import { UserConnectionId } from '../../../../../../../src/Electron/Domain/Entities/UserConnectionId.js';
import { Result } from '../../../../../../../src/Shared/Result/Result.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function user(devices: string[] = ['device-a', 'device-b']): User {
    const u = new User('user-1', 'alice', 'alice', null, 'Alice');
    u.connectionIds = devices.map((device) => new UserConnectionId(device, u));
    return u;
}

function syncWith(tags: string[]): ILedgerSyncService {
    const state = new GroupState(GROUP_ID);
    for (const tag of tags) {
        state.members.set(tag, new GroupMember(tag, tag, ChatPrivileges.Member, `${tag}-id`, 1, [], []));
    }

    return { sync: async () => Result.success({ state, rejected: [], halted: null, stalledAt: null }) };
}

describe('removing a member', () => {
    test('queues the removal', async () => {
        const appended: DomainEvent[] = [];
        const sut = new RemoveGroupMemberCommandHandler(
            { appendEvent: async (e: DomainEvent) => void appended.push(e) } as IEventRepository,
            { get: async () => user() } as unknown as IUserRepository,
            syncWith(['alice', 'bob']),
            { notify: () => {}, start: () => {}, stop: () => {} } as IPump,
        );

        const result = await sut.handle(new RemoveGroupMemberCommand(GROUP_ID, 'bob'));

        expect(result.success).toBe(true);
        const queued = appended[0] as LedgerOperationQueuedEvent;
        expect(queued.operation.type).toBe(LedgerOperationType.MemberRemoved);
    });

    test('refuses to remove someone who is not in the group', async () => {
        const appended: DomainEvent[] = [];
        const sut = new RemoveGroupMemberCommandHandler(
            { appendEvent: async (e: DomainEvent) => void appended.push(e) } as IEventRepository,
            { get: async () => user() } as unknown as IUserRepository,
            syncWith(['alice']),
            { notify: () => {}, start: () => {}, stop: () => {} } as IPump,
        );

        const result = await sut.handle(new RemoveGroupMemberCommand(GROUP_ID, 'bob'));

        expect(result.success).toBe(false);
        expect(appended).toEqual([]);
    });
});
