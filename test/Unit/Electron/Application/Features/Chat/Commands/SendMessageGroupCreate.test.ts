import { describe, expect, test } from 'vitest';
import { SendMessageCommandHandler } from '../../../../../../../src/Electron/Application/Features/Chat/Commands/SendMessageCommandHandler.js';
import { SendMessageCommand } from '../../../../../../../src/Electron/Application/Features/Chat/Contracts/SendMessage.js';
import { IChatStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { IGroupKeyRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IUserRepository.js';
import { IDeviceRepository } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IDeviceRepository.js';
import { IEventRepository } from '../../../../../../../src/Electron/Application/Contracts/Providers/IEventRepository.js';
import { IMediaStore } from '../../../../../../../src/Electron/Application/Contracts/Repositories/IMediaStore.js';
import { IPump } from '../../../../../../../src/Electron/Application/Contracts/Services/IPump.js';
import { ILedgerIdentity } from '../../../../../../../src/Electron/Infrastructure/Interfaces/ILedgerIdentity.js';
import { GroupCreatedPayload, PayloadType } from '../../../../../../../src/Electron/Application/Contracts/Messaging/Envelope.js';
import { Chat } from '../../../../../../../src/Electron/Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../../../../src/Electron/Domain/Entities/ChatMember.js';
import { GroupEpochKey } from '../../../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import { GroupRecord } from '../../../../../../../src/Electron/Domain/Entities/GroupRecord.js';
import { GroupLifecycle } from '../../../../../../../src/Electron/Domain/Enums/GroupLifecycle.js';
import { ChatPrivileges } from '../../../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';
import { LedgerOperationType } from '../../../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { GroupCreatedOperation } from '../../../../../../../src/Electron/Domain/Operations/LedgerOperation.js';
import { EnvelopeQueuedEvent } from '../../../../../../../src/Electron/Domain/Events/EnvelopeQueuedEvent.js';
import { LedgerOperationQueuedEvent } from '../../../../../../../src/Electron/Domain/Events/LedgerOperationQueuedEvent.js';
import { MessageSentEvent } from '../../../../../../../src/Electron/Domain/Events/MessageSentEvent.js';
import { DomainEvent } from '../../../../../../../src/Electron/Domain/Events/IDomainEvent.js';
import { User } from '../../../../../../../src/Electron/Domain/Aggregates/User.js';
import { generateWriteKeyPair } from '../../../../../../../src/Electron/Infrastructure/Crypto/LedgerCodec.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function groupChat(): Chat {
    const bob = ChatMember.createExternal('m1', ChatPrivileges.Member, 'bob', 'Bob', ['bob-device']);
    const carol = ChatMember.createExternal('m2', ChatPrivileges.Member, 'carol', 'Carol', ['carol-device']);

    const chat = new Chat(GROUP_ID, [bob, carol], [], 0, false, GROUP_ID);
    chat.groupName = 'Trip';

    return chat;
}

function harness(chat: Chat | null, group: GroupRecord | null) {
    const appended: DomainEvent[] = [];
    const savedGroups: GroupRecord[] = [];
    const writeKey = generateWriteKeyPair();

    const eventRepository = { appendEvent: async (e: DomainEvent) => void appended.push(e) } as IEventRepository;
    const chatStore = {
        storeMessage: async () => undefined,
        getChat: async () => chat,
        getChatWithMembers: async () => chat,
    } as unknown as IChatStore;
    const mediaStore = { store: async () => undefined } as unknown as IMediaStore;
    const outboxPump = { notify: () => {}, start: () => {}, stop: () => {} } as IPump;
    const groupRepository = {
        get: async () => group,
        save: async (g: GroupRecord) => void savedGroups.push(g),
    } as unknown as IGroupRepository;
    const groupKeyRepository = {
        getWriteKey: async () => new GroupWriteKey(GROUP_ID, writeKey.publicKey, writeKey.privateKey),
        getEpochKey: async () => new GroupEpochKey(GROUP_ID, 1, Buffer.alloc(32, 0x07)),
    } as unknown as IGroupKeyRepository;
    const userRepository = {
        get: async () => new User('user-1', 'alice', 'alice', 'Alice'),
    } as unknown as IUserRepository;
    const deviceRepository = { get: async () => ({ connectionId: 'alice-device' }) } as unknown as IDeviceRepository;
    const ledgerIdentity = {
        publicKey: async () => Buffer.alloc(33, 0x05),
        peerPublicKey: async () => Buffer.alloc(33, 0x06),
        sign: async () => Buffer.alloc(64),
        verify: () => true,
    } as ILedgerIdentity;

    const sut = new SendMessageCommandHandler(
        eventRepository,
        chatStore,
        mediaStore,
        groupRepository,
        userRepository,
        ledgerIdentity,
        groupKeyRepository,
        deviceRepository,
        outboxPump,
    );

    return { sut, appended, savedGroups, writeKey };
}

function command(): SendMessageCommand {
    return new SendMessageCommand(GROUP_ID, 'msg-1', 'conn-1', ['alice', 'bob'], ['conn-2'], 'hello', []);
}

describe('sending the first message to a group', () => {
    test('queues the creation, the envelopes and the message, in that order', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Draft));

        await h.sut.handle(command());

        expect(h.appended.map((e) => e.constructor.name)).toEqual([
            'LedgerOperationQueuedEvent',
            'EnvelopeQueuedEvent',
            'EnvelopeQueuedEvent',
            'MessageSentEvent',
        ]);
    });

    test('seats every member in the one creation event', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Draft));

        await h.sut.handle(command());

        const queued = h.appended.find((e) => e instanceof LedgerOperationQueuedEvent) as LedgerOperationQueuedEvent;
        const operation = queued.operation as GroupCreatedOperation;

        expect(queued.createsStream).toBe(true);
        expect(operation.type).toBe(LedgerOperationType.GroupCreated);
        expect(operation.members.map((m) => m.userTag)).toEqual(['alice', 'bob', 'carol']);
        expect(operation.members[0].privilege).toBe(ChatPrivileges.Owner);
        expect(operation.members.every((m) => m.writeKeyPublic.length > 0)).toBe(true);
        expect(operation.members[1].connectionIds).toEqual(['bob-device']);
    });

    test('hands each member their own write key and nobody elses', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Draft));

        await h.sut.handle(command());

        const envelopes = h.appended.filter((e) => e instanceof EnvelopeQueuedEvent) as EnvelopeQueuedEvent[];
        const payloads = envelopes.map((e) => e.payload as GroupCreatedPayload);

        expect(envelopes.map((e) => e.payloadType)).toEqual([PayloadType.GroupCreated, PayloadType.GroupCreated]);
        expect(envelopes.map((e) => e.connectionIds)).toEqual([['bob-device'], ['carol-device']]);

        const [toBob, toCarol] = payloads;
        expect(toBob.writeKeyPrivate).not.toBe(toCarol.writeKeyPrivate);
        expect(toBob.epochKey).toBe(Buffer.alloc(32, 0x07).toString('base64'));
        expect(toBob.members.map((m) => m.userTag)).toEqual(['alice', 'bob', 'carol']);
    });

    test('moves the group out of draft so it is never created twice', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Draft));

        await h.sut.handle(command());

        expect(h.savedGroups[0].lifecycle).toBe(GroupLifecycle.Active);
    });
});

describe('later messages', () => {
    test('do not queue a second creation once the group is past draft', async () => {
        const h = harness(groupChat(), new GroupRecord(GROUP_ID, GroupLifecycle.Active));

        await h.sut.handle(command());

        expect(h.appended.filter((e) => e instanceof LedgerOperationQueuedEvent)).toEqual([]);
        expect(h.appended.filter((e) => e instanceof MessageSentEvent)).toHaveLength(1);
    });

    test('leave one to one chats untouched', async () => {
        const h = harness(new Chat('chat-1', [], []), null);

        await h.sut.handle(command());

        expect(h.appended.map((e) => e.constructor.name)).toEqual(['MessageSentEvent']);
    });
});
