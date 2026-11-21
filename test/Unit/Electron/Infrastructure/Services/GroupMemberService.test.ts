import { describe, expect, test, vi } from 'vitest';
import { GroupMemberService } from '#electron/Infrastructure/Services/GroupMemberService';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupMemberAddedEvent } from '#electron/Domain/Events/GroupMemberAddedEvent';
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

const alice = (privilege = ChatPrivileges.Owner) => new GroupMember(ALICE, 'Alice', privilege, 1, ['alice-key'], [], ['alice-laptop', 'alice-phone']);
const bob = () => new GroupMember(BOB, 'Bob', ChatPrivileges.Member, 1, ['bob-key'], [], ['bob-laptop']);
const carol = (inviteKeys = ['carol-invite']) => new GroupMember(CAROL, 'Carol', ChatPrivileges.Member, 6, [], inviteKeys, ['carol-laptop']);
const replayed = (state: GroupState) => Result.success<ReplayResult>({ state, rejected: [], verified: [], halted: null, stalledAt: null });

function invite() {
    return new GroupMemberAddedEvent(
        'event-1',
        GROUP_ID,
        new MemberAddedOperation(ALICE, new GroupMemberRef(CAROL, 'Carol', ChatPrivileges.Member, null, [], ['carol-invite'], ['carol-laptop'])),
        { 'carol-laptop': 'carol-private' },
        new Date(1),
    );
}

interface Setup {
    syncState?: GroupState;
    invite?: boolean;
    pending?: GroupMemberAddedEvent[];
    append?: Result<void>;
    send?: () => Promise<DeliveryStatus>;
    chatMembers?: { userTag: string; avatar: string | null }[];
}

function setup({ syncState = stateWith(alice(), bob()), invite: inviteOnly = false, pending = [], append = Result.success(), send = async () => DeliveryStatus.Sent, chatMembers = [{ userTag: BOB, avatar: null }] }: Setup = {}) {
    const chat = { members: [...chatMembers] };
    const chatStore = { getChat: vi.fn(async () => chat), getChatWithMembers: vi.fn(async () => chat), create: vi.fn(async () => chat) };
    const ledgerSyncService = { sync: vi.fn(async () => replayed(syncState)) };
    const ledgerWriter = { append: vi.fn(async (_groupId: string, _operation: MemberAddedOperation) => append) };
    const eventRepository = {
        appendEvent: vi.fn(async (_event: GroupMemberAddedEvent) => undefined),
        getEvents: vi.fn(async () => pending),
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

    const sut = new GroupMemberService(
        chatStore as never,
        { getById: async () => ({ id: CAROL, username: 'carol', displayName: 'Carol', avatarKey: null, connectionIds: [{ connectionId: 'carol-laptop' }, { connectionId: 'carol-phone' }] }) } as never,
        { get: async () => ({ userTag: ALICE, avatarKey: null }) } as never,
        { get: async () => ({ connectionId: 'alice-laptop' }) } as never,
        { get: async () => new Group(GROUP_ID, GroupLifecycle.Active) } as never,
        {
            getWriteKey: async () => ({ isInvite: inviteOnly }),
            getEpochKeys: async () => [{ epoch: 2, key: Buffer.from('second') }, { epoch: 1, key: Buffer.from('first') }],
        } as never,
        ledgerSyncService as never,
        ledgerWriter as never,
        eventRepository as never,
        sessionManager as never,
        messageHubHandler as never,
        { isDestroyed: () => false, webContents: { send: windowSend } } as never,
    );

    return { sut, chat, chatStore, ledgerWriter, ledgerSyncService, eventRepository, encrypted, messageHubHandler, windowSend };
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

describe('delivering an invite', () => {
    test('writes the member, sends the strap at the new head and tells the other devices', async () => {
        const after = stateWith(alice(), bob(), carol());
        const { sut, ledgerWriter, encrypted, eventRepository } = setup({ syncState: after, pending: [invite()] });

        await sut.reconcile(GROUP_ID, stateWith(alice(), bob()));

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
        const state = stateWith(alice(), bob(), carol());
        const { sut, ledgerWriter, messageHubHandler, eventRepository } = setup({ syncState: state, pending: [invite()] });

        await sut.reconcile(GROUP_ID, state);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
        expect(messageHubHandler.sendMessage).toHaveBeenCalledOnce();
        expect(eventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    test('keeps the invite for the next try when the send fails', async () => {
        const state = stateWith(alice(), bob(), carol());
        const { sut, eventRepository } = setup({ syncState: state, pending: [invite()], send: async () => { throw new Error('offline'); } });

        await sut.reconcile(GROUP_ID, state);

        expect(eventRepository.deleteEvent).not.toHaveBeenCalled();
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
    });

    test('keeps the invite when the ledger cannot be reached', async () => {
        const { sut, eventRepository, messageHubHandler } = setup({ pending: [invite()], append: Result.fail(new ErrorMessage('ApiError', 'offline')) });

        await sut.reconcile(GROUP_ID, stateWith(alice(), bob()));

        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
        expect(eventRepository.markAsFailed).not.toHaveBeenCalled();
    });

    test('stops retrying when the ledger refuses the member', async () => {
        const { sut, eventRepository, messageHubHandler } = setup({ pending: [invite()], append: Result.fail(new ErrorMessage('Forbidden', 'no')) });

        await sut.reconcile(GROUP_ID, stateWith(alice(), bob()));

        expect(eventRepository.markAsFailed).toHaveBeenCalledWith('event-1', 'no');
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
    });

    test('stops retrying when the member was added with other keys', async () => {
        const state = stateWith(alice(), carol(['someone-elses-invite']));
        const { sut, eventRepository, messageHubHandler } = setup({ syncState: state, pending: [invite()] });

        await sut.reconcile(GROUP_ID, state);

        expect(eventRepository.markAsFailed).toHaveBeenCalledOnce();
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
    });
});

describe('keeping the chat in step with the ledger', () => {
    test('adds a member the chat does not know and tells the window', async () => {
        const { sut, chat, chatStore, windowSend } = setup();

        await sut.reconcile(GROUP_ID, stateWith(alice(), bob(), carol()));

        expect(chat.members.map((member) => member.userTag)).toEqual([BOB, CAROL]);
        expect(chatStore.create).toHaveBeenCalledOnce();
        expect(windowSend).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('does nothing when the chat is up to date', async () => {
        const { sut, chatStore, windowSend } = setup();

        await sut.reconcile(GROUP_ID, stateWith(alice(), bob()));

        expect(chatStore.create).not.toHaveBeenCalled();
        expect(windowSend).not.toHaveBeenCalled();
    });
});
