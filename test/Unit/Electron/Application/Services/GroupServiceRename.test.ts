import { describe, expect, test, vi } from 'vitest';
import { GroupService } from '#electron/Application/Services/GroupService';
import { ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { LedgerOperationType } from '#electron/Domain/Enums/LedgerOperationType';
import { GroupChangeEvent } from '#electron/Domain/Events/GroupChangeEvent';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { SettingsChangedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { Envelope, Payload, PayloadType } from '#electron/Domain/Protocol/Payload';
import { GROUP_NAME_MAX_LENGTH } from '#shared/Chat/RenameGroup';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { Result } from '#shared/Result/Result';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const ALICE = '111111111111';

function stateWith(privilege: ChatPrivileges, name: string | null = 'Trip') {
    const state = new GroupState(GROUP_ID);
    state.name = name;
    state.headHash = Buffer.alloc(32, 5);
    state.members.set(ALICE, new GroupMember(ALICE, 'Alice', privilege, 1, ['alice-key'], [], ['alice-laptop']));
    state.members.set('bob', new GroupMember('bob', 'Bob', ChatPrivileges.Member, 1, ['bob-key'], [], ['bob-laptop']));
    return state;
}

function setup(group: Group, state = stateWith(ChatPrivileges.Owner), afterAppend?: GroupState, inviteOnly = false) {
    let current = state;
    const chatStore = { getChatWithMembers: vi.fn(async () => ({ members: [] })), setGroupName: vi.fn(async () => undefined) };
    const ledgerSyncService = { sync: vi.fn(async () => Result.success<ReplayResult>({ state: current, rejected: [], verified: [], halted: null, stalledAt: null })) };
    const ledgerWriter = {
        append: vi.fn(async () => {
            if (afterAppend) current = afterAppend;
            return Result.success();
        }),
    };
    const eventRepository = {
        appendEvent: vi.fn(async (_event: GroupChangeEvent) => undefined),
        deleteEvent: vi.fn(async (_id: string) => undefined),
        markAsFailed: vi.fn(async () => undefined),
    };
    const encrypted = new Map<string, Payload>();
    const sessionManager = {
        encrypt: vi.fn(async (envelope: Envelope<Payload>, connectionId: string) => {
            encrypted.set(connectionId, envelope.payloads[0]);
            return 'cipher';
        }),
    };
    const messageHubHandler = { sendMessage: vi.fn(async () => DeliveryStatus.Sent) };
    const windowSend = vi.fn();

    const sut = new GroupService(
        { get: async () => group } as never,
        { getWriteKey: async () => ({ isInvite: inviteOnly }), getEpochKeys: async () => [] } as never,
        { get: async () => ({ userTag: ALICE, avatarKey: null }) } as never,
        { get: async () => ({ connectionId: 'alice-laptop' }) } as never,
        chatStore as never,
        ledgerWriter as never,
        {} as never,
        ledgerSyncService as never,
        eventRepository as never,
        sessionManager as never,
        messageHubHandler as never,
        { isDestroyed: () => false, webContents: { send: windowSend } } as never,
    );

    return { sut, chatStore, ledgerSyncService, ledgerWriter, eventRepository, encrypted, messageHubHandler, windowSend };
}

const active = () => new Group(GROUP_ID, GroupLifecycle.Active);
const draft = () => new Group(GROUP_ID, GroupLifecycle.Draft);
const prepared = () => Object.assign(draft(), { pendingStart: { straps: {} } }) as Group;
const change = (name: string) => new GroupChangeEvent('event-1', GROUP_ID, new SettingsChangedOperation(ALICE, name, null), {}, new Date(1));

describe('renaming a group', () => {
    test('renames a draft locally, with nothing on the ledger or in the queue', async () => {
        const { sut, chatStore, eventRepository, ledgerSyncService, windowSend } = setup(draft());

        expect((await sut.renameGroup(GROUP_ID, '  New name  ')).success).toBe(true);

        expect(chatStore.setGroupName).toHaveBeenCalledWith(GROUP_ID, 'New name');
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
        expect(windowSend).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('queues the rename when the first send is already prepared', async () => {
        const { sut, chatStore, eventRepository } = setup(prepared());

        expect((await sut.renameGroup(GROUP_ID, 'New name')).success).toBe(true);

        expect(chatStore.setGroupName).not.toHaveBeenCalled();
        expect(eventRepository.appendEvent).toHaveBeenCalledOnce();
    });

    test.each([ChatPrivileges.Owner, ChatPrivileges.Admin])('privilege %s queues a settings change', async (privilege) => {
        const { sut, eventRepository, ledgerWriter } = setup(active(), stateWith(privilege));

        expect((await sut.renameGroup(GROUP_ID, 'New name')).success).toBe(true);

        const event = eventRepository.appendEvent.mock.calls[0][0];
        expect(event.operation.type).toBe(LedgerOperationType.SettingsChanged);
        expect((event.operation as SettingsChangedOperation).name).toBe('New name');
        expect((event.operation as SettingsChangedOperation).messageTtl).toBeNull();
        expect(event.inviteKeys).toEqual({});
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test('refuses a member', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(ChatPrivileges.Member));

        expect((await sut.renameGroup(GROUP_ID, 'New name')).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('refuses a device holding only an invite key', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner), undefined, true);

        expect((await sut.renameGroup(GROUP_ID, 'New name')).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test.each(['', '   ', 'x'.repeat(GROUP_NAME_MAX_LENGTH + 1)])('refuses the name %j', async (name) => {
        const { sut, chatStore, eventRepository } = setup(draft());

        expect((await sut.renameGroup(GROUP_ID, name)).success).toBe(false);
        expect(chatStore.setGroupName).not.toHaveBeenCalled();
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('does nothing when the name is unchanged', async () => {
        const { sut, eventRepository } = setup(active());

        expect((await sut.renameGroup(GROUP_ID, 'Trip')).success).toBe(true);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });
});

describe('delivering a rename', () => {
    test('writes it to the ledger, tells the other devices and clears it', async () => {
        const { sut, ledgerWriter, encrypted, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner), stateWith(ChatPrivileges.Owner, 'New name'));

        expect(await sut.deliverChange(change('New name'))).toBe(true);

        expect(ledgerWriter.append).toHaveBeenCalledOnce();
        expect(encrypted.get('bob-laptop')?.type).toBe(PayloadType.GroupUpdated);
        expect(encrypted.has('alice-laptop')).toBe(false);
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('does not write it twice when only the send is left', async () => {
        const { sut, ledgerWriter, messageHubHandler } = setup(active(), stateWith(ChatPrivileges.Owner, 'New name'));

        expect(await sut.deliverChange(change('New name'))).toBe(true);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).toHaveBeenCalledOnce();
    });

    test('waits until the group is active', async () => {
        const { sut, ledgerWriter } = setup(prepared());

        expect(await sut.deliverChange(change('New name'))).toBe(false);
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });
});
