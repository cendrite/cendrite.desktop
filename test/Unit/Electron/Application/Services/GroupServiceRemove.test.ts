import { describe, expect, test, vi } from 'vitest';
import { GroupService } from '#electron/Application/Services/GroupService';
import { ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { LedgerOperationType } from '#electron/Domain/Enums/LedgerOperationType';
import { GroupChangeEvent } from '#electron/Domain/Events/GroupChangeEvent';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { MemberRemovedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { Envelope, Payload, PayloadType } from '#electron/Domain/Protocol/Payload';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { Result } from '#shared/Result/Result';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const ALICE = '111111111111';
const ALICE_KEY = Buffer.from('alice-key').toString('base64');
const BOB = '222222222222';
const CAROL = '333333333333';

function stateWith(author: ChatPrivileges, target: ChatPrivileges | null = ChatPrivileges.Member) {
    const state = new GroupState(GROUP_ID);
    state.headHash = Buffer.alloc(32, 5);
    state.members.set(ALICE, new GroupMember(ALICE, 'Alice', author, 1, [ALICE_KEY], [], ['alice-laptop']));
    state.members.set(CAROL, new GroupMember(CAROL, 'Carol', ChatPrivileges.Member, 1, ['carol-key'], [], ['carol-laptop']));
    if (target !== null) state.members.set(BOB, new GroupMember(BOB, 'Bob', target, 1, ['bob-key'], [], ['bob-laptop', 'bob-phone']));
    return state;
}

function setup(group: Group, state = stateWith(ChatPrivileges.Owner), afterAppend?: GroupState) {
    let current = state;
    const chat = { members: [{ id: 'member-bob', userTag: BOB, avatar: null, devices: ['bob-laptop'] }] };
    const chatStore = { getChatWithMembers: vi.fn(async () => chat), removeMembers: vi.fn(async () => undefined) };
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
        { getWriteKey: async () => ({ isInvite: false, publicKey: Buffer.from('alice-key') }), getEpochKeys: async () => [] } as never,
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
const change = () => new GroupChangeEvent('event-1', GROUP_ID, new MemberRemovedOperation(ALICE, BOB), {}, new Date(1), ['bob-laptop', 'bob-phone']);

describe('removing a member', () => {
    test('removes them from a draft locally', async () => {
        const { sut, chatStore, eventRepository, ledgerSyncService, windowSend } = setup(draft());

        expect((await sut.removeMember(GROUP_ID, BOB)).success).toBe(true);

        expect(chatStore.removeMembers).toHaveBeenCalledWith(['member-bob']);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
        expect(windowSend).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('queues the removal when the first send is already prepared', async () => {
        const { sut, chatStore, eventRepository } = setup(prepared());

        expect((await sut.removeMember(GROUP_ID, BOB)).success).toBe(true);

        expect(chatStore.removeMembers).not.toHaveBeenCalled();
        expect(eventRepository.appendEvent.mock.calls[0][0].alsoNotify).toEqual(['bob-laptop']);
    });

    test.each([
        [ChatPrivileges.Owner, ChatPrivileges.Admin],
        [ChatPrivileges.Owner, ChatPrivileges.Member],
        [ChatPrivileges.Admin, ChatPrivileges.Member],
    ])('privilege %s can remove privilege %s and keeps their devices to notify', async (author, target) => {
        const { sut, eventRepository, ledgerWriter } = setup(active(), stateWith(author, target));

        expect((await sut.removeMember(GROUP_ID, BOB)).success).toBe(true);

        const event = eventRepository.appendEvent.mock.calls[0][0];
        expect(event.operation.type).toBe(LedgerOperationType.MemberRemoved);
        expect((event.operation as MemberRemovedOperation).userTag).toBe(BOB);
        expect(event.alsoNotify).toEqual(['bob-laptop', 'bob-phone']);
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test.each([
        [ChatPrivileges.Member, ChatPrivileges.Member],
        [ChatPrivileges.Admin, ChatPrivileges.Admin],
        [ChatPrivileges.Admin, ChatPrivileges.Owner],
    ])('refuses privilege %s removing privilege %s', async (author, target) => {
        const { sut, eventRepository } = setup(active(), stateWith(author, target));

        expect((await sut.removeMember(GROUP_ID, BOB)).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('refuses removing yourself', async () => {
        const { sut, eventRepository } = setup(active());

        expect((await sut.removeMember(GROUP_ID, ALICE)).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('refuses someone outside the group', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner, null));

        expect((await sut.removeMember(GROUP_ID, BOB)).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });
});

describe('delivering a removal', () => {
    test('writes it, then tells both the remaining and the removed devices to sync', async () => {
        const { sut, ledgerWriter, encrypted, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner), stateWith(ChatPrivileges.Owner, null));

        expect(await sut.deliverChange(change())).toBe(true);

        expect(ledgerWriter.append).toHaveBeenCalledOnce();
        for (const device of ['carol-laptop', 'bob-laptop', 'bob-phone']) {
            expect(encrypted.get(device)?.type).toBe(PayloadType.GroupUpdated);
        }
        expect(encrypted.has('alice-laptop')).toBe(false);
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('drops a removal queued by someone who has since been demoted', async () => {
        const { sut, ledgerWriter, messageHubHandler, eventRepository } = setup(active(), stateWith(ChatPrivileges.Member));

        expect(await sut.deliverChange(change())).toBe(true);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('a duplicate removal writes once and both complete', async () => {
        const { sut, ledgerWriter, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner), stateWith(ChatPrivileges.Owner, null));

        expect(await sut.deliverChange(change())).toBe(true);
        expect(await sut.deliverChange(change())).toBe(true);

        expect(ledgerWriter.append).toHaveBeenCalledOnce();
        expect(eventRepository.deleteEvent).toHaveBeenCalledTimes(2);
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
    });

    test('does not write it twice, and still tells the removed devices', async () => {
        const { sut, ledgerWriter, encrypted } = setup(active(), stateWith(ChatPrivileges.Owner, null));

        expect(await sut.deliverChange(change())).toBe(true);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(encrypted.get('bob-phone')?.type).toBe(PayloadType.GroupUpdated);
    });
});
