import { describe, expect, test, vi } from 'vitest';
import { GroupService } from '#electron/Application/Services/Group/GroupService';
import { ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { LedgerOperationType } from '#electron/Domain/Enums/LedgerOperationType';
import { GroupChangeEvent } from '#electron/Domain/Events/GroupChangeEvent';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { MemberLeftOperation, PrivilegeChangedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { Envelope, Payload, PayloadType } from '#electron/Domain/Protocol/Payload';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { Result } from '#shared/Result/Result';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const ALICE = '111111111111';
const ALICE_KEY = Buffer.from('alice-key').toString('base64');
const BOB = '222222222222';

function stateWith(alice: ChatPrivileges | null, bob: ChatPrivileges | null = ChatPrivileges.Owner) {
    const state = new GroupState(GROUP_ID);
    state.headHash = Buffer.alloc(32, 5);
    if (alice !== null) state.members.set(ALICE, new GroupMember(ALICE, 'Alice', alice, 1, [ALICE_KEY, 'alice-phone-key'], [], ['alice-laptop', 'alice-phone']));
    if (bob !== null) state.members.set(BOB, new GroupMember(BOB, 'Bob', bob, 1, ['bob-key'], [], ['bob-laptop']));
    return state;
}

function setup(group: Group, state = stateWith(ChatPrivileges.Member), options: { afterAppend?: GroupState; invite?: boolean; chatMembers?: number } = {}) {
    let current = state;
    const chat = { members: Array.from({ length: options.chatMembers ?? 1 }, () => ({ id: 'member-bob', userTag: BOB, avatar: null, devices: ['bob-laptop'] })) };
    const chatStore = { getChatWithMembers: vi.fn(async () => chat) };
    const ledgerSyncService = {
        sync: vi.fn(async () => Result.success<ReplayResult>({ state: current, rejected: [], verified: [], halted: null, stalledAt: null })),
        wipeGroup: vi.fn(async () => undefined),
    };
    const ledgerWriter = {
        append: vi.fn(async () => {
            if (options.afterAppend) current = options.afterAppend;
            return Result.success();
        }),
    };
    const eventRepository = {
        appendEvent: vi.fn(async (_event: GroupChangeEvent) => undefined),
        deleteEvent: vi.fn(async (_id: string) => undefined),
    };
    const encrypted = new Map<string, Payload>();
    const sessionManager = {
        encrypt: vi.fn(async (envelope: Envelope<Payload>, connectionId: string) => {
            encrypted.set(connectionId, envelope.payloads[0]);
            return 'cipher';
        }),
    };
    const messageHubHandler = { sendMessage: vi.fn(async () => DeliveryStatus.Sent) };

    const sut = new GroupService(
        { get: async () => group } as never,
        { getWriteKey: async () => ({ isInvite: options.invite ?? false, publicKey: Buffer.from('alice-key') }), getEpochKeys: async () => [] } as never,
        { get: async () => ({ userTag: ALICE, avatarKey: null }) } as never,
        { get: async () => ({ connectionId: 'alice-laptop' }) } as never,
        chatStore as never,
        ledgerWriter as never,
        {} as never,
        ledgerSyncService as never,
        eventRepository as never,
        sessionManager as never,
        messageHubHandler as never,
        { isDestroyed: () => false, webContents: { send: vi.fn() } } as never,
    );

    return { sut, ledgerSyncService, ledgerWriter, eventRepository, encrypted, messageHubHandler };
}

const active = () => new Group(GROUP_ID, GroupLifecycle.Active);
const draft = () => new Group(GROUP_ID, GroupLifecycle.Draft);
const prepared = () => Object.assign(draft(), { pendingStart: { straps: {} } }) as Group;
const change = () => new GroupChangeEvent('event-1', GROUP_ID, new MemberLeftOperation(ALICE, ALICE_KEY), {}, new Date(1));

describe('leaving a group', () => {
    test('wipes a draft that was never sent without the ledger', async () => {
        const { sut, ledgerSyncService, eventRepository } = setup(draft());

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(true);

        expect(ledgerSyncService.wipeGroup).toHaveBeenCalledWith(GROUP_ID);
        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('refuses a prepared draft with other members until a new owner is chosen', async () => {
        const { sut, ledgerSyncService, eventRepository } = setup(prepared());

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(false);

        expect(ledgerSyncService.wipeGroup).not.toHaveBeenCalled();
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('queues the hand-over and the leave for a prepared draft', async () => {
        const { sut, eventRepository } = setup(prepared());

        expect((await sut.leaveGroup(GROUP_ID, BOB)).success).toBe(true);

        const types = eventRepository.appendEvent.mock.calls.map(([event]) => event.operation.type);
        expect(types).toEqual([LedgerOperationType.PrivilegeChanged, LedgerOperationType.MemberLeft]);
    });

    test('wipes a prepared draft with nobody else in it', async () => {
        const { sut, ledgerSyncService, eventRepository } = setup(prepared(), undefined, { chatMembers: 0 });

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(true);

        expect(ledgerSyncService.wipeGroup).toHaveBeenCalledWith(GROUP_ID);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test.each([ChatPrivileges.Member, ChatPrivileges.Admin])('queues a leave with this device key for privilege %s', async (privilege) => {
        const { sut, eventRepository, ledgerWriter } = setup(active(), stateWith(privilege));

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(true);

        const operation = eventRepository.appendEvent.mock.calls[0][0].operation as MemberLeftOperation;
        expect(operation.type).toBe(LedgerOperationType.MemberLeft);
        expect(operation.authorTag).toBe(ALICE);
        expect(operation.writeKeyPublic).toBe(ALICE_KEY);
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test('refuses the only owner who has not chosen a new owner', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner, ChatPrivileges.Admin));

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('refuses a new owner who is not in the group', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner, ChatPrivileges.Admin));

        expect((await sut.leaveGroup(GROUP_ID, '999999999999')).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('the only owner hands over to the chosen member before leaving', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner, ChatPrivileges.Member));

        expect((await sut.leaveGroup(GROUP_ID, BOB)).success).toBe(true);

        const [promotion, leave] = eventRepository.appendEvent.mock.calls.map(([event]) => event);
        const operation = promotion.operation as PrivilegeChangedOperation;
        expect(operation.type).toBe(LedgerOperationType.PrivilegeChanged);
        expect(operation.userTag).toBe(BOB);
        expect(operation.privilege).toBe(ChatPrivileges.Owner);
        expect(leave.operation.type).toBe(LedgerOperationType.MemberLeft);
        expect(leave.occurredOn.getTime()).toBeGreaterThan(promotion.occurredOn.getTime());
    });

    test('lets an owner leave when another owner remains', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner, ChatPrivileges.Owner));

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(true);
        expect(eventRepository.appendEvent).toHaveBeenCalledOnce();
    });

    test('the last member wipes the group without writing to the ledger', async () => {
        const { sut, ledgerSyncService, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner, null));

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(true);

        expect(ledgerSyncService.wipeGroup).toHaveBeenCalledWith(GROUP_ID);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('refuses while this device only holds an invite key', async () => {
        const { sut, eventRepository } = setup(active(), undefined, { invite: true });

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });

    test('refuses someone who is no longer in the group', async () => {
        const { sut, eventRepository } = setup(active(), stateWith(null));

        expect((await sut.leaveGroup(GROUP_ID, null)).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });
});

describe('delivering a leave', () => {
    test('writes it, tells the other members and own devices, then syncs', async () => {
        const { sut, ledgerWriter, ledgerSyncService, encrypted, messageHubHandler, eventRepository } = setup(active(), stateWith(ChatPrivileges.Member), {
            afterAppend: stateWith(null),
        });

        expect(await sut.deliverChange(change())).toBe(true);

        expect(ledgerWriter.append).toHaveBeenCalledOnce();
        expect(encrypted.get('bob-laptop')?.type).toBe(PayloadType.GroupUpdated);
        expect(encrypted.get('alice-phone')?.type).toBe(PayloadType.GroupUpdated);
        expect(encrypted.has('alice-laptop')).toBe(false);
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');

        const sent = messageHubHandler.sendMessage.mock.invocationCallOrder[0];
        const lastSync = ledgerSyncService.sync.mock.invocationCallOrder.at(-1)!;
        expect(ledgerSyncService.sync).toHaveBeenCalledTimes(2);
        expect(sent).toBeLessThan(lastSync);
    });

    test('completes even when the hint cannot be sent', async () => {
        const { sut, messageHubHandler, eventRepository } = setup(active(), stateWith(ChatPrivileges.Member), { afterAppend: stateWith(null) });
        messageHubHandler.sendMessage.mockResolvedValueOnce(DeliveryStatus.Failed);

        expect(await sut.deliverChange(change())).toBe(true);
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('drops a leave by the only owner when the hand-over did not happen', async () => {
        const { sut, ledgerWriter, messageHubHandler, eventRepository } = setup(active(), stateWith(ChatPrivileges.Owner, ChatPrivileges.Member));

        expect(await sut.deliverChange(change())).toBe(true);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('a leave already on the ledger completes without writing or sending', async () => {
        const { sut, ledgerWriter, messageHubHandler, eventRepository } = setup(active(), stateWith(null));

        expect(await sut.deliverChange(change())).toBe(true);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });
});
