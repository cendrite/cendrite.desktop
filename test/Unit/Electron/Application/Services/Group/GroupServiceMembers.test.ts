import { describe, expect, test, vi } from 'vitest';
import { GroupService } from '#electron/Application/Services/Group/GroupService';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupChangeEvent } from '#electron/Domain/Events/GroupChangeEvent';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { GroupMemberRef, MemberAddedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { Envelope, GroupStrapPayload, Payload, PayloadType } from '#electron/Domain/Protocol/Payload';
import { ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { ServerMessage } from '#electron/Application/Contracts/Services/IMessageHubHandler';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const ALICE = '111111111111';
const ALICE_KEY = Buffer.from('alice-key').toString('base64');
const BOB = '222222222222';
const CAROL = '333333333333';

function stateWith(...members: GroupMember[]) {
    const state = new GroupState(GROUP_ID);
    state.version = 5;
    state.headHash = Buffer.alloc(32, 5);
    state.name = 'Trip';
    for (const member of members) state.members.set(member.userTag, member);
    return state;
}

const alice = (privilege = ChatPrivileges.Owner) => new GroupMember(ALICE, 'Alice', privilege, 1, [ALICE_KEY], [], ['alice-laptop', 'alice-phone']);
const bob = () => new GroupMember(BOB, 'Bob', ChatPrivileges.Member, 1, ['bob-key'], [], ['bob-laptop']);
const carol = (inviteKeys = ['carol-invite']) => new GroupMember(CAROL, 'Carol', ChatPrivileges.Member, 6, [], inviteKeys, ['carol-laptop']);
const replayed = (state: GroupState) => Result.success<ReplayResult>({ state, rejected: [], verified: [], halted: null, stalledAt: null });

function invite() {
    return new GroupChangeEvent(
        'event-1',
        GROUP_ID,
        new MemberAddedOperation(ALICE, new GroupMemberRef(CAROL, 'Carol', ChatPrivileges.Member, null, [], ['carol-invite'], ['carol-laptop'])),
        { 'carol-laptop': 'carol-private' },
        new Date(1),
    );
}

interface Setup {
    syncState?: GroupState;
    afterAppend?: GroupState;
    group?: Group;
    invite?: boolean;
    append?: Result<void>;
    send?: () => Promise<DeliveryStatus>;
    chatMembers?: { userTag: string; avatar: string | null }[];
}

function setup({ syncState = stateWith(alice(), bob()), afterAppend, group = new Group(GROUP_ID, GroupLifecycle.Active), invite: inviteOnly = false, append = Result.success(), send = async () => DeliveryStatus.Sent, chatMembers = [{ userTag: BOB, avatar: null }] }: Setup = {}) {
    const chat = { members: [...chatMembers] };
    const chatStore = { getChatWithMembers: vi.fn(async () => chat), addMembers: vi.fn(async (_chatId: string, _members: { userTag: string }[]) => undefined) };
    let current = syncState;
    const ledgerSyncService = { sync: vi.fn(async () => replayed(current)) };
    const ledgerWriter = {
        append: vi.fn(async (_groupId: string, _operation: MemberAddedOperation) => {
            if (append.success && afterAppend) current = afterAppend;
            return append;
        }),
    };
    const eventRepository = {
        appendEvent: vi.fn(async (_event: GroupChangeEvent) => undefined),
        deleteEvent: vi.fn(async (_id: string) => undefined),
        markAsFailed: vi.fn(async (_id: string, _error: string) => undefined),
    };
    const encrypted = new Map<string, Payload>();
    const sessionManager = {
        encrypt: vi.fn(async (envelope: Envelope<Payload>, connectionId: string) => {
            encrypted.set(connectionId, envelope.payloads[0]);
            return `cipher-${connectionId}`;
        }),
    };
    const messageHubHandler = { sendMessage: vi.fn(async (_messages: ServerMessage[]) => send()) };

    const windowSend = vi.fn();

    const sut = new GroupService(
        { get: async () => group } as never,
        {
            getWriteKey: async () => ({ isInvite: inviteOnly, publicKey: Buffer.from('alice-key') }),
            getEpochKeys: async () => [{ epoch: 2, key: Buffer.from('second') }, { epoch: 1, key: Buffer.from('first') }],
        } as never,
        { get: async () => ({ userTag: ALICE, avatarKey: null }) } as never,
        { get: async () => ({ connectionId: 'alice-laptop' }) } as never,
        chatStore as never,
        ledgerWriter as never,
        { getById: async () => ({ id: CAROL, username: 'carol', displayName: 'Carol', avatarKey: null, connectionIds: [{ connectionId: 'carol-laptop' }, { connectionId: 'carol-phone' }] }) } as never,
        ledgerSyncService as never,
        eventRepository as never,
        sessionManager as never,
        messageHubHandler as never,
        { isDestroyed: () => false, webContents: { send: windowSend } } as never,
    );

    return { sut, ledgerWriter, ledgerSyncService, chatStore, eventRepository, encrypted, messageHubHandler, windowSend };
}

describe('adding a member', () => {
    test('queues one invite key per device of the friend', async () => {
        const { sut, eventRepository, ledgerWriter } = setup();

        const result = await sut.addMember(GROUP_ID, CAROL);

        expect(result.success).toBe(true);
        const event = eventRepository.appendEvent.mock.calls[0][0];
        expect(Object.keys(event.inviteKeys)).toEqual(['carol-laptop', 'carol-phone']);
        expect(event.operation.member.inviteKeys).toHaveLength(2);
        expect(event.operation.member.privilege).toBe(ChatPrivileges.Member);
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test.each([
        ['a member', { syncState: stateWith(alice(ChatPrivileges.Member), bob()) }],
        ['a device holding only an invite key', { invite: true }],
        ['someone already in the group', { syncState: stateWith(alice(), carol()) }],
    ])('refuses %s', async (_name, options) => {
        const { sut, eventRepository } = setup(options);

        expect((await sut.addMember(GROUP_ID, CAROL)).success).toBe(false);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
    });
});

describe('adding a member before the first message', () => {
    const draft = () => new Group(GROUP_ID, GroupLifecycle.Draft);
    const prepared = () => Object.assign(draft(), { pendingStart: { straps: {} } });

    test('puts them straight in the chat, with nothing on the ledger or in the queue', async () => {
        const { sut, chatStore, eventRepository, ledgerSyncService, windowSend } = setup({ group: draft() });

        const result = await sut.addMember(GROUP_ID, CAROL);

        expect(result.success).toBe(true);
        expect(chatStore.addMembers.mock.calls[0][1].map((member) => member.userTag)).toEqual([CAROL]);
        expect(eventRepository.appendEvent).not.toHaveBeenCalled();
        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
        expect(windowSend).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('refuses someone already in the draft', async () => {
        const { sut, chatStore } = setup({ group: draft(), chatMembers: [{ userTag: CAROL, avatar: null }] });

        expect((await sut.addMember(GROUP_ID, CAROL)).success).toBe(false);
        expect(chatStore.addMembers).not.toHaveBeenCalled();
    });

    test('queues the change when the first send is already prepared', async () => {
        const { sut, chatStore, eventRepository } = setup({ group: prepared() as Group });

        expect((await sut.addMember(GROUP_ID, CAROL)).success).toBe(true);

        expect(chatStore.addMembers).not.toHaveBeenCalled();
        expect(eventRepository.appendEvent).toHaveBeenCalledOnce();
    });

    test('holds a queued change until the group is active', async () => {
        const { sut, ledgerWriter, ledgerSyncService, eventRepository } = setup({ group: prepared() as Group });

        expect(await sut.deliverChange(invite())).toBe(false);

        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(eventRepository.deleteEvent).not.toHaveBeenCalled();
    });
});

describe('delivering an invite', () => {
    test('writes the member, sends the strap at the new head and tells the other devices', async () => {
        const after = stateWith(alice(), bob(), carol());
        const { sut, ledgerWriter, encrypted, eventRepository } = setup({ afterAppend: after });

        expect(await sut.deliverChange(invite())).toBe(true);

        expect(ledgerWriter.append).toHaveBeenCalledOnce();
        const strap = encrypted.get('carol-laptop') as GroupStrapPayload;
        expect(strap.type).toBe(PayloadType.GroupCreated);
        expect(strap.inviteKeyPrivate).toBe('carol-private');
        expect(strap.version).toBe(5);
        expect(strap.epochKeys).toEqual([Buffer.from('first').toString('base64'), Buffer.from('second').toString('base64')]);
        expect(strap.members.map((member) => member.userTag)).toEqual([ALICE, BOB, CAROL]);
        expect(encrypted.get('bob-laptop')?.type).toBe(PayloadType.GroupUpdated);
        expect(encrypted.get('alice-phone')?.type).toBe(PayloadType.GroupUpdated);
        expect(encrypted.has('alice-laptop')).toBe(false);
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('does not write the member again when only the send is left', async () => {
        const { sut, ledgerWriter, messageHubHandler, eventRepository } = setup({ syncState: stateWith(alice(), bob(), carol()) });

        expect(await sut.deliverChange(invite())).toBe(true);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).toHaveBeenCalledOnce();
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('keeps the invite for the next try when the send is not accepted', async () => {
        const { sut, eventRepository } = setup({ syncState: stateWith(alice(), bob(), carol()), send: async () => DeliveryStatus.Failed });

        expect(await sut.deliverChange(invite())).toBe(false);

        expect(eventRepository.deleteEvent).not.toHaveBeenCalled();
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
    });

    test('keeps the invite when the ledger cannot be reached', async () => {
        const { sut, eventRepository, messageHubHandler } = setup({ append: Result.fail(new ErrorMessage('ApiError', 'offline')) });

        expect(await sut.deliverChange(invite())).toBe(false);

        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
    });

    test('drops the change when the ledger refuses it', async () => {
        const { sut, eventRepository, messageHubHandler } = setup({ append: Result.fail(new ErrorMessage('Forbidden', 'no')) });

        expect(await sut.deliverChange(invite())).toBe(true);

        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
    });

    test('never writes or sends an invite queued by someone who has since been demoted', async () => {
        const { sut, ledgerWriter, eventRepository, messageHubHandler, encrypted } = setup({ syncState: stateWith(alice(ChatPrivileges.Member), bob()) });

        expect(await sut.deliverChange(invite())).toBe(true);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
        expect(encrypted.size).toBe(0);
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('a duplicate add ends cleanly and leaves no invite keys behind', async () => {
        const { sut, eventRepository, messageHubHandler } = setup({ syncState: stateWith(alice(), carol(['someone-elses-invite'])) });

        expect(await sut.deliverChange(invite())).toBe(true);

        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
    });
});
