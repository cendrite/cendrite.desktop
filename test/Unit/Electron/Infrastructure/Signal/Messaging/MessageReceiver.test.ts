import { describe, expect, test, vi } from 'vitest';
import { MessageReceiver } from '#electron/Infrastructure/Signal/Messaging/MessageReceiver';
import { ServerMessage } from '#electron/Application/Contracts/Services/IMessageHubHandler';
import { ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { DeliveryStatusPayload, Envelope, MessagePayload, Payload } from '#electron/Domain/Protocol/Payload';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';

const CHAT_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

const chatMessage = () => new MessagePayload('msg-1', CHAT_ID, 'hi', [], ['alice', 'bob'], DeliveryStatus.Pending, 'token', new Date(1));

function stateWith(...devices: string[]) {
    const state = new GroupState(CHAT_ID);
    state.members.set('member', new GroupMember('member', 'Member', ChatPrivileges.Member, 1, [], [], devices));
    return state;
}

interface Setup {
    group?: boolean;
    memberDevices?: string[];
    ownDevices?: string[];
    sync?: Result<ReplayResult>;
    payload?: Payload;
}

function setup({ group = true, memberDevices = ['bob-laptop'], ownDevices = ['alice-phone'], sync = replayed(stateWith()), payload = chatMessage() }: Setup = {}) {
    const chat = { id: CHAT_ID, members: [{ devices: memberDevices }] };
    const chatStore = {
        getChat: vi.fn(async () => chat),
        getChatWithMembers: vi.fn(async () => chat),
        markListed: vi.fn(async () => undefined),
        storeMessage: vi.fn(async () => undefined),
        updateDeliveryStatus: vi.fn(async () => undefined),
    };
    const ledgerSyncService = { sync: vi.fn(async () => sync) };

    const sut = new MessageReceiver(
        { decrypt: async () => new Envelope([payload]) } as never,
        chatStore as never,
        { store: vi.fn() } as never,
        { get: async () => [] } as never,
        { getById: async () => null } as never,
        { get: async () => ({ userTag: 'alice', connectionIds: ownDevices.map((connectionId) => ({ connectionId })) }) } as never,
        { get: async () => (group ? new Group(CHAT_ID, GroupLifecycle.Active) : null) } as never,
        {} as never,
        { webContents: { send: vi.fn() } } as never,
        { notify: vi.fn(async () => undefined), notifyMessage: vi.fn(async () => undefined) } as never,
        { notify: vi.fn() } as never,
        ledgerSyncService as never,
    );

    return { sut, chatStore, ledgerSyncService };
}

function replayed(state: GroupState, halted = false, stalledAt: number | null = null) {
    return Result.success<ReplayResult>({ state, rejected: [], verified: [], halted: halted ? { version: 1, reason: 'bad' } : null, stalledAt });
}

const from = (senderId: string) => new ServerMessage('server-1', senderId, 'alice-laptop', 'cipher');

describe('accepting a group message', () => {
    test('accepts a device of a member without syncing', async () => {
        const { sut, chatStore, ledgerSyncService } = setup();

        await sut.handle(from('bob-laptop'));

        expect(chatStore.storeMessage).toHaveBeenCalledOnce();
        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
    });

    test('accepts this user\'s other device without syncing', async () => {
        const { sut, chatStore, ledgerSyncService } = setup();

        await sut.handle(from('alice-phone'));

        expect(chatStore.storeMessage).toHaveBeenCalledOnce();
        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
    });

    test('syncs once and accepts a member this device did not know yet', async () => {
        const { sut, chatStore, ledgerSyncService } = setup({ sync: replayed(stateWith('carol-laptop')) });

        await sut.handle(from('carol-laptop'));

        expect(ledgerSyncService.sync).toHaveBeenCalledOnce();
        expect(chatStore.storeMessage).toHaveBeenCalledOnce();
    });

    test('drops a sender who is not in the group after syncing', async () => {
        const { sut, chatStore } = setup({ sync: replayed(stateWith('bob-laptop')) });

        await sut.handle(from('mallory-laptop'));

        expect(chatStore.storeMessage).not.toHaveBeenCalled();
    });

    test.each([
        ['the ledger cannot be reached', Result.fail<ReplayResult>(new ErrorMessage('ApiError', 'offline'))],
        ['the log halted', replayed(stateWith('carol-laptop'), true)],
        ['the log stalled', replayed(stateWith('carol-laptop'), false, 2)],
    ])('drops an unknown sender when %s', async (_name, sync) => {
        const { sut, chatStore } = setup({ sync });

        await sut.handle(from('carol-laptop'));

        expect(chatStore.storeMessage).not.toHaveBeenCalled();
    });

    test('drops a delivery status from someone outside the group', async () => {
        const payload = new DeliveryStatusPayload(CHAT_ID, ['msg-1'], DeliveryStatus.Read, []);
        const { sut, chatStore } = setup({ payload });

        await sut.handle(from('mallory-laptop'));

        expect(chatStore.updateDeliveryStatus).not.toHaveBeenCalled();
    });

    test('accepts a delivery status from a member', async () => {
        const payload = new DeliveryStatusPayload(CHAT_ID, ['msg-1'], DeliveryStatus.Read, []);
        const { sut, chatStore } = setup({ payload });

        await sut.handle(from('bob-laptop'));

        expect(chatStore.updateDeliveryStatus).toHaveBeenCalledOnce();
    });

    test('does not check direct messages', async () => {
        const { sut, chatStore, ledgerSyncService } = setup({ group: false });

        await sut.handle(from('anyone'));

        expect(ledgerSyncService.sync).not.toHaveBeenCalled();
        expect(chatStore.storeMessage).toHaveBeenCalledOnce();
    });
});
