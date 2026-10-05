import { describe, expect, test, vi } from 'vitest';
import { GroupInviteService } from '../../../../../src/Electron/Infrastructure/Services/GroupInviteService.js';
import {
    GroupInvitePayload,
    GroupWriteKeyOfferPayload,
    LedgerAdvancedPayload,
    PayloadType,
} from '../../../../../src/Electron/Application/Contracts/Messaging/Envelope.js';
import { IGroupKeyRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { IChatStore } from '../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { IUserRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IUserRepository.js';
import { IEventRepository } from '../../../../../src/Electron/Application/Contracts/Providers/IEventRepository.js';
import { ILedgerSyncService } from '../../../../../src/Electron/Application/Contracts/Services/ILedgerSyncService.js';
import { IPump } from '../../../../../src/Electron/Application/Contracts/Services/IPump.js';
import { Chat } from '../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { GroupEpochKey } from '../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import { GroupRecord } from '../../../../../src/Electron/Domain/Entities/GroupRecord.js';
import { GroupLifecycle } from '../../../../../src/Electron/Domain/Enums/GroupLifecycle.js';
import { ChatPrivileges } from '../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { GroupMember } from '../../../../../src/Electron/Domain/Projections/GroupMember.js';
import { GroupState } from '../../../../../src/Electron/Domain/Projections/GroupState.js';
import { ControlMessageQueuedEvent } from '../../../../../src/Electron/Domain/Events/ControlMessageQueuedEvent.js';
import { LedgerOperationQueuedEvent } from '../../../../../src/Electron/Domain/Events/LedgerOperationQueuedEvent.js';
import { DomainEvent } from '../../../../../src/Electron/Domain/Events/IDomainEvent.js';
import { User } from '../../../../../src/Electron/Domain/Aggregates/User.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function stateWith(tags: string[]): GroupState {
    const state = new GroupState(GROUP_ID);
    state.name = 'Trip';
    state.version = 2;
    state.headHash = Buffer.alloc(32, 0x7a);

    for (const tag of tags) {
        state.members.set(tag, new GroupMember(tag, tag, ChatPrivileges.Member, `${tag}-identity`, 1, [], []));
    }

    return state;
}

function harness(state: GroupState, options: { syncFails?: boolean; existingWriteKey?: boolean; chat?: Chat } = {}) {
    const epochKeys: GroupEpochKey[] = [];
    const writeKeys: GroupWriteKey[] = [];
    const chats: Chat[] = options.chat ? [options.chat] : [];
    const groups: GroupRecord[] = [];
    const appended: DomainEvent[] = [];
    const sent: { type: PayloadType; connectionIds: string[] }[] = [];

    const groupKeyRepository = {
        saveEpochKey: async (key: GroupEpochKey) => void epochKeys.push(key),
        saveWriteKey: async (key: GroupWriteKey) => void writeKeys.push(key),
        getWriteKey: async () =>
            options.existingWriteKey ? new GroupWriteKey(GROUP_ID, Buffer.alloc(32), Buffer.alloc(32)) : null,
    } as unknown as IGroupKeyRepository;

    const groupRepository = {
        get: async () => groups[groups.length - 1] ?? null,
        save: async (group: GroupRecord) => void groups.push(group),
    } as unknown as IGroupRepository;

    const ledgerSyncService: ILedgerSyncService = {
        sync: async () =>
            options.syncFails
                ? Result.fail(new ErrorMessage('ApiError', 'offline'))
                : Result.success({ state, rejected: [], halted: null, stalledAt: null }),
    };

    const chatStore = {
        getChat: async () => chats[0] ?? null,
        create: async (chat: Chat) => void chats.push(chat),
    } as unknown as IChatStore;

    const userRepository = {
        get: async () => new User('user-1', 'alice', 'alice', 'Alice'),
    } as unknown as IUserRepository;

    const eventRepository = {
        appendEvent: async (e: DomainEvent) => {
            appended.push(e);
            if (e instanceof ControlMessageQueuedEvent) sent.push({ type: e.payloadType, connectionIds: e.connectionIds });
        },
    } as IEventRepository;

    const ledgerPump = { notify: () => {}, start: () => {}, stop: () => {} } as IPump;
    const mainWindow = { webContents: { send: vi.fn() } } as unknown as Electron.BrowserWindow;

    const sut = new GroupInviteService(
        groupKeyRepository,
        groupRepository,
        ledgerSyncService,
        chatStore,
        userRepository,
        eventRepository,
        ledgerPump,
        mainWindow,
    );

    return { sut, epochKeys, writeKeys, chats, groups, appended, sent, mainWindow };
}

function invite(): GroupInvitePayload {
    return new GroupInvitePayload(GROUP_ID, { 1: Buffer.alloc(32, 0x01).toString('base64') }, 2, []);
}

describe('accepting an invite', () => {
    test('stores the keys, shows the chat and offers a write key back', async () => {
        const h = harness(stateWith(['alice', 'bob']));

        await h.sut.acceptInvite(invite(), 'bob-device');

        expect(h.epochKeys[0].epoch).toBe(1);
        expect(h.chats[0].isGroup).toBe(true);
        expect(h.chats[0].groupName).toBe('Trip');
        expect(h.groups[0].lifecycle).toBe(GroupLifecycle.Active);
        expect(h.writeKeys[0].publicKey).toHaveLength(32);
        expect(h.sent).toEqual([{ type: PayloadType.GroupWriteKeyOffer, connectionIds: ['bob-device'] }]);
    });

    test('ignores an invite the ledger does not back', async () => {
        const h = harness(stateWith(['bob', 'carol']));

        await h.sut.acceptInvite(invite(), 'bob-device');

        expect(h.epochKeys).toHaveLength(1);
        expect(h.chats).toEqual([]);
        expect(h.sent).toEqual([]);
    });

    test('does not offer a second write key when it already has one', async () => {
        const h = harness(stateWith(['alice']), { existingWriteKey: true });

        await h.sut.acceptInvite(invite(), 'bob-device');

        expect(h.writeKeys).toEqual([]);
        expect(h.sent).toEqual([]);
    });

    test('stops at the keys when the ledger cannot be reached', async () => {
        const h = harness(stateWith(['alice']), { syncFails: true });

        await h.sut.acceptInvite(invite(), 'bob-device');

        expect(h.epochKeys).toHaveLength(1);
        expect(h.chats).toEqual([]);
    });
});

describe('an invitee offering its write key', () => {
    test('queues a member addition when they are not in the group yet', async () => {
        const h = harness(stateWith(['alice']));

        await h.sut.registerWriteKey(
            new GroupWriteKeyOfferPayload(GROUP_ID, 'bob-key', 'bob', 'Bob', 'bob-identity', []),
            'bob-device',
        );

        const queued = h.appended.find((e) => e instanceof LedgerOperationQueuedEvent) as LedgerOperationQueuedEvent;
        expect(queued.operation.type).toBe(LedgerOperationType.MemberAdded);
        expect(queued.createsStream).toBe(false);
    });

    test('queues a key registration when they are already a member', async () => {
        const h = harness(stateWith(['alice', 'bob']));

        await h.sut.registerWriteKey(
            new GroupWriteKeyOfferPayload(GROUP_ID, 'bob-key', 'bob', 'Bob', 'bob-identity', []),
            'bob-device',
        );

        const queued = h.appended.find((e) => e instanceof LedgerOperationQueuedEvent) as LedgerOperationQueuedEvent;
        expect(queued.operation.type).toBe(LedgerOperationType.WriteKeyRegistered);
    });

    test('ignores a key it already registered', async () => {
        const state = stateWith(['alice', 'bob']);
        state.members.get('bob')!.writeKeys = ['bob-key'];
        const h = harness(state);

        await h.sut.registerWriteKey(
            new GroupWriteKeyOfferPayload(GROUP_ID, 'bob-key', 'bob', 'Bob', 'bob-identity', []),
            'bob-device',
        );

        expect(h.appended.filter((e) => e instanceof LedgerOperationQueuedEvent)).toEqual([]);
    });
});

describe('catching up', () => {
    test('projects the group when the head matches', async () => {
        const state = stateWith(['alice', 'bob']);
        const h = harness(state);

        await h.sut.catchUp(new LedgerAdvancedPayload(GROUP_ID, 2, state.headHash.toString('base64'), []));

        expect(h.chats[0].groupName).toBe('Trip');
        expect(h.mainWindow.webContents.send).toHaveBeenCalled();
    });

    test('reports a fork when the claimed head differs at the same version', async () => {
        const h = harness(stateWith(['alice']));

        await h.sut.catchUp(new LedgerAdvancedPayload(GROUP_ID, 2, Buffer.alloc(32, 0xff).toString('base64'), []));

        expect(h.chats).toEqual([]);
        expect(h.mainWindow.webContents.send).toHaveBeenCalledWith(
            'eventMessage',
            expect.objectContaining({ kind: 'ledgerFork' }),
        );
    });
});
