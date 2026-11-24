import { IMediaStore } from '#electron/Application/Contracts/Repositories/IMediaStore';
import { IOutboxRepository } from '#electron/Infrastructure/Interfaces/IOutboxRepository';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { describe, expect, test, vi } from 'vitest';
import { LedgerSyncService } from '../../../../../src/Electron/Infrastructure/Services/LedgerSyncService.js';
import {
    ILedgerProvider,
    LedgerEvent,
    LedgerEventsPage,
    LedgerHead,
    LedgerReadProof,
} from '../../../../../src/Electron/Application/Contracts/Providers/ILedgerProvider.js';
import { IGroupKeyRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupKeyRepository.js';
import { GroupWriteKey } from '../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import {
    buildReadSigningInput,
    generateWriteKeyPair,
    verifyOuter,
} from '../../../../../src/Electron/Infrastructure/Crypto/LedgerCodec.js';
import { ILedgerLogRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/ILedgerLogRepository.js';
import { IGroupRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import {
    ILedgerReplayService,
    ReplayResult,
} from '../../../../../src/Electron/Application/Contracts/Services/ILedgerReplayService.js';
import { Group } from '../../../../../src/Electron/Domain/Entities/Group.js';
import { LedgerEventRecord } from '../../../../../src/Electron/Domain/Entities/LedgerEventRecord.js';
import { LedgerEventStatus } from '../../../../../src/Electron/Domain/Enums/LedgerEventStatus.js';
import { GroupState } from '../../../../../src/Electron/Domain/Projections/GroupState.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function event(version: number): LedgerEvent {
    return new LedgerEvent(
        GROUP_ID,
        version,
        Buffer.alloc(32, version),
        Buffer.from([version]),
        Buffer.alloc(32, 0xa1),
        Buffer.alloc(64, 0x7f),
        [],
        [],
        [],
        [],
    );
}

function logRepository(existing: LedgerEventRecord[] = []) {
    const stored = [...existing];
    const statuses: { version: number; status: LedgerEventStatus; reason: string | null }[] = [];
    const verified: { version: number; userTag: string }[] = [];

    const repository: ILedgerLogRepository = {
        append: async (records) => void stored.push(...records),
        getFrom: async (_groupId, from) => stored.filter((r) => r.version >= from),
        getAll: async () => stored,
        getLastVersion: async () => stored.reduce((max, r) => Math.max(max, r.version), 0),
        setStatus: async (_groupId, version, status, reason = null) => void statuses.push({ version, status, reason }),
        setVerifiedAuthor: async (_groupId, version, userTag) => void verified.push({ version, userTag }),
        deleteAll: async () => void (stored.length = 0),
    };

    return { repository, stored, statuses, verified };
}

function groupRepository() {
    const saved: Group[] = [];

    const repository: IGroupRepository = {
        create: async (group) => void saved.push(group),
        update: async (group) => void saved.push(group),
        get: async () => saved[saved.length - 1] ?? null,
        getByLifecycle: async () => [],
        deleteAll: async () => undefined,
    };

    return { repository, saved };
}

function replayService(result: Partial<ReplayResult> = {}): ILedgerReplayService {
    const state = result.state ?? new GroupState(GROUP_ID);

    return {
        replay: async () =>
            ({ rejected: [], verified: [], halted: null, stalledAt: null, ...result, state }) as ReplayResult,
    };
}

function chatDependencies(chat: { members: { id?: string; userTag: string; privilege?: ChatPrivileges; connectionIds?: string[] | null }[]; groupName?: string | null } | null = null, send = vi.fn()) {
    return [
        {
            getChat: async () => chat,
            getChatWithMembers: async () => chat,
            addMembers: vi.fn(async (_chatId: string, members: { userTag: string }[]) => void chat?.members.push(...members)),
            setGroupName: vi.fn(async (_chatId: string, name: string | null) => void (chat && (chat.groupName = name))),
            setMemberPrivilege: vi.fn(async (memberId: string, privilege: ChatPrivileges) => {
                const member = chat?.members.find((candidate) => candidate.id === memberId);
                if (member) member.privilege = privilege;
            }),
            setMemberDevices: vi.fn(async (memberId: string, connectionIds: string[]) => {
                const member = chat?.members.find((candidate) => candidate.id === memberId);
                if (member) member.connectionIds = connectionIds;
            }),
            removeMembers: vi.fn(async (memberIds: string[]) => {
                if (chat) chat.members = chat.members.filter((member) => !memberIds.includes(member.id ?? ''));
            }),
            getMediaIds: vi.fn(async () => ['media-1', 'media-2']),
            deleteChat: vi.fn(async () => undefined),
        },
        { get: async () => ({ userTag: 'alice' }) },
        { isDestroyed: () => false, webContents: { send } },
        { delete: vi.fn(async () => undefined) },
        { deleteForGroup: vi.fn(async () => undefined) },
    ] as unknown as [IChatStore, IUserRepository, Electron.BrowserWindow, IMediaStore, IOutboxRepository];
}

const WRITE_KEY = generateWriteKeyPair();

function groupKeys(writeKey: GroupWriteKey | null = new GroupWriteKey(GROUP_ID, WRITE_KEY.publicKey, WRITE_KEY.privateKey)): IGroupKeyRepository {
    return {
        saveWriteKey: async () => undefined,
        getWriteKey: async () => writeKey,
        saveEpochKey: async () => undefined,
        getEpochKey: async () => null,
        getEpochKeys: async () => [],
        deleteAll: async () => undefined,
    };
}

function provider(pages: LedgerEventsPage[]): { provider: ILedgerProvider; requested: number[]; proofs: LedgerReadProof[] } {
    const requested: number[] = [];
    const proofs: LedgerReadProof[] = [];
    let index = 0;

    return {
        requested,
        proofs,
        provider: {
            createStream: async () => Result.success<void>(),
            appendEvent: async () => Result.success<void>(),
            archiveStream: async () => Result.success<void>(),
            getEvents: async (_groupId, fromVersion, proof) => {
                requested.push(fromVersion);
                proofs.push(proof);
                return Result.success(pages[Math.min(index++, pages.length - 1)]);
            },
            getHead: async (): Promise<Result<LedgerHead>> =>
                Result.success({ version: 0, hash: Buffer.alloc(32), archived: false }),
        },
    };
}

describe('syncing', () => {
    test('stores new events and records the replayed head', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const state = new GroupState(GROUP_ID);
        state.version = 2;
        state.headHash = Buffer.alloc(32, 0xcc);

        const { provider: p } = provider([{ version: 2, archived: false, hasMore: false, events: [event(1), event(2)] }]);
        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies());

        const result = await sut.sync(GROUP_ID);

        expect(result.success).toBe(true);
        expect(log.stored.map((r) => r.version)).toEqual([1, 2]);
        expect(groups.saved[0].version).toBe(2);
        expect(Buffer.from(groups.saved[0].headHash)).toEqual(Buffer.alloc(32, 0xcc));
    });

    test('asks only for what it does not already have', async () => {
        const log = logRepository();
        await log.repository.append([
            new LedgerEventRecord(GROUP_ID, 1, Buffer.alloc(32), Buffer.from([1]), Buffer.alloc(32), Buffer.alloc(64), Buffer.alloc(32)),
        ]);

        const { provider: p, requested } = provider([{ version: 1, archived: false, hasMore: false, events: [] }]);
        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys(), ...chatDependencies());

        await sut.sync(GROUP_ID);

        expect(requested).toEqual([2]);
    });

    test('keeps paging while the server says there is more', async () => {
        const log = logRepository();
        const { provider: p, requested } = provider([
            { version: 3, archived: false, hasMore: true, events: [event(1), event(2)] },
            { version: 3, archived: false, hasMore: false, events: [event(3)] },
        ]);

        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys(), ...chatDependencies());

        await sut.sync(GROUP_ID);

        expect(requested).toEqual([1, 3]);
        expect(log.stored.map((r) => r.version)).toEqual([1, 2, 3]);
    });

    test('marks rejected events with the reason replay gave', async () => {
        const log = logRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);

        const sut = new LedgerSyncService(
            p,
            log.repository,
            groupRepository().repository,
            replayService({ rejected: [{ version: 1, reason: 'author is not an admin' }] }),
            groupKeys(), ...chatDependencies());

        await sut.sync(GROUP_ID);

        expect(log.statuses).toEqual([
            { version: 1, status: LedgerEventStatus.Rejected, reason: 'author is not an admin' },
        ]);
    });

    test('remembers the authors replay verified', async () => {
        const log = logRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);

        const sut = new LedgerSyncService(
            p,
            log.repository,
            groupRepository().repository,
            replayService({ verified: [{ version: 1, userTag: '482177301593' }] }),
            groupKeys(), ...chatDependencies());

        await sut.sync(GROUP_ID);

        expect(log.verified).toEqual([{ version: 1, userTag: '482177301593' }]);
    });

    test('marks a stall so it can be resumed when the key arrives', async () => {
        const log = logRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);

        const sut = new LedgerSyncService(
            p,
            log.repository,
            groupRepository().repository,
            replayService({ stalledAt: 1 }),
            groupKeys(), ...chatDependencies());

        await sut.sync(GROUP_ID);

        expect(log.statuses[0]).toEqual({ version: 1, status: LedgerEventStatus.Stalled, reason: null });
    });

    test('records that the group was archived', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: true, hasMore: false, events: [event(1)] }]);

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService(), groupKeys(), ...chatDependencies());

        await sut.sync(GROUP_ID);

        expect(groups.saved[0].archived).toBe(true);
    });

    test('adds a member the chat does not know and tells the window', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        for (const tag of ['alice', 'bob', 'carol']) {
            state.members.set(tag, new GroupMember(tag, tag, ChatPrivileges.Member, 1, [], [], [`${tag}-device`]));
        }
        const chat = { members: [{ userTag: 'bob', privilege: ChatPrivileges.Member }] };
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies(chat, send));

        await sut.sync(GROUP_ID);

        expect(chat.members.map((member) => member.userTag)).toEqual(['bob', 'carol']);
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('copies a new group name from the ledger and tells the window', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.name = 'New name';
        state.members.set('bob', new GroupMember('bob', 'bob', ChatPrivileges.Member, 1, [], [], ['bob-device']));
        const chat = { members: [{ userTag: 'bob', privilege: ChatPrivileges.Member }], groupName: 'Old name' as string | null };
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies(chat, send));

        await sut.sync(GROUP_ID);

        expect(chat.groupName).toBe('New name');
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('does not announce anything when the chat already matches', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.name = 'Trip';
        state.members.set('bob', new GroupMember('bob', 'bob', ChatPrivileges.Member, 1, [], [], ['bob-device']));
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies({ members: [{ userTag: 'bob', privilege: ChatPrivileges.Member }], groupName: 'Trip' }, send));

        await sut.sync(GROUP_ID);

        expect(send).not.toHaveBeenCalled();
    });

    test('stores this user\'s privilege from the ledger and tells the window', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('alice', new GroupMember('alice', 'alice', ChatPrivileges.Admin, 1, [], [], ['alice-device']));
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies({ members: [] }, send));

        await sut.sync(GROUP_ID);

        expect(groups.saved[0].privilege).toBe(ChatPrivileges.Admin);
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('does not take a privilege from a log that halted', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('alice', new GroupMember('alice', 'alice', ChatPrivileges.Owner, 1, [], [], ['alice-device']));

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state, halted: { version: 1, reason: 'bad' } }), groupKeys(), ...chatDependencies({ members: [] }));

        await sut.sync(GROUP_ID);

        expect(groups.saved[0].privilege).toBe(ChatPrivileges.Member);
    });

    test('copies a member privilege from the ledger and tells the window', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('bob', new GroupMember('bob', 'bob', ChatPrivileges.Admin, 1, [], [], ['bob-device']));
        const chat = { members: [{ id: 'member-bob', userTag: 'bob', privilege: ChatPrivileges.Member }] };
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies(chat, send));

        await sut.sync(GROUP_ID);

        expect(chat.members[0].privilege).toBe(ChatPrivileges.Admin);
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('removes a member the ledger no longer has and tells the window', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('alice', new GroupMember('alice', 'alice', ChatPrivileges.Owner, 1, [], [], ['alice-device']));
        state.members.set('bob', new GroupMember('bob', 'bob', ChatPrivileges.Member, 1, [], [], ['bob-device']));
        const chat = { members: [{ id: 'member-bob', userTag: 'bob', privilege: ChatPrivileges.Member }, { id: 'member-carol', userTag: 'carol', privilege: ChatPrivileges.Member }] };
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies(chat, send));

        await sut.sync(GROUP_ID);

        expect(chat.members.map((member) => member.userTag)).toEqual(['bob']);
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    function removedSetup(options: Partial<ReplayResult> = {}) {
        const logDelete = vi.fn(async () => undefined);
        const keyDelete = vi.fn(async () => undefined);
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 3, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.removed.add('alice');
        const send = vi.fn();
        const dependencies = chatDependencies({ members: [] }, send);
        const sut = new LedgerSyncService(
            p,
            { ...log.repository, deleteForGroup: logDelete },
            groups.repository,
            replayService({ state, ...options }),
            { ...groupKeys(), deleteForGroup: keyDelete },
            ...dependencies,
        );
        const [chatStore, , , mediaStore, eventRepository] = dependencies;

        return { sut, groups, send, logDelete, keyDelete, chatStore, mediaStore, eventRepository };
    }

    test('wipes the whole group from this device when the log removed this user', async () => {
        const { sut, groups, send, logDelete, keyDelete, chatStore, mediaStore, eventRepository } = removedSetup();

        await sut.sync(GROUP_ID);

        expect(mediaStore.delete).toHaveBeenCalledTimes(2);
        expect(chatStore.deleteChat).toHaveBeenCalledWith(GROUP_ID);
        expect(eventRepository.deleteForGroup).toHaveBeenCalledWith(GROUP_ID);
        expect(logDelete).toHaveBeenCalledWith(GROUP_ID);
        expect(keyDelete).toHaveBeenCalledWith(GROUP_ID);
        expect(groups.saved.at(-1)!.lifecycle).toBe(GroupLifecycle.Left);
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupRemoved', groupId: GROUP_ID });
    });

    test('still wipes when a media file is already gone', async () => {
        const { sut, chatStore, mediaStore } = removedSetup();
        vi.mocked(mediaStore.delete).mockRejectedValue(new Error('missing'));

        await sut.sync(GROUP_ID);

        expect(chatStore.deleteChat).toHaveBeenCalledWith(GROUP_ID);
    });

    test.each([
        ['halted', { halted: { version: 3, reason: 'bad' } }],
        ['stalled', { stalledAt: 3 }],
    ])('does not wipe from a log that %s', async (_name, options) => {
        const { sut, chatStore, keyDelete } = removedSetup(options);

        await sut.sync(GROUP_ID);

        expect(chatStore.deleteChat).not.toHaveBeenCalled();
        expect(keyDelete).not.toHaveBeenCalled();
    });

    test('does not wipe when the ledger refuses this device', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const provider404 = {
            getEvents: async () => Result.fail(new ErrorMessage('Not Found', 'gone')),
        } as never;
        const dependencies = chatDependencies({ members: [] });

        const result = await new LedgerSyncService(provider404, log.repository, groups.repository, replayService(), groupKeys(), ...dependencies).sync(GROUP_ID);

        expect(result.success).toBe(false);
        expect(dependencies[0].deleteChat).not.toHaveBeenCalled();
    });

    test('does not wipe when this user is simply not listed', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('bob', new GroupMember('bob', 'bob', ChatPrivileges.Member, 1, [], [], ['bob-device']));
        const dependencies = chatDependencies({ members: [{ id: 'member-bob', userTag: 'bob', privilege: ChatPrivileges.Member }] });

        await new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...dependencies).sync(GROUP_ID);

        expect(dependencies[0].deleteChat).not.toHaveBeenCalled();
    });

    test('updates the devices of a member who is not a friend', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('bob', new GroupMember('bob', 'bob', ChatPrivileges.Member, 1, ['key'], [], ['bob-phone']));
        const chat = { members: [{ id: 'member-bob', userTag: 'bob', privilege: ChatPrivileges.Member, connectionIds: ['bob-laptop', 'bob-phone'] }] };
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies(chat, send));

        await sut.sync(GROUP_ID);

        expect(chat.members[0].connectionIds).toEqual(['bob-phone']);
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupChanged', groupId: GROUP_ID });
    });

    test('leaves the devices of a friend to the friend list', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('bob', new GroupMember('bob', 'bob', ChatPrivileges.Member, 1, ['key'], [], ['bob-phone']));
        const chat = { members: [{ id: 'member-bob', userTag: 'bob', privilege: ChatPrivileges.Member, connectionIds: null }] };
        const send = vi.fn();

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys(), ...chatDependencies(chat, send));

        await sut.sync(GROUP_ID);

        expect(chat.members[0].connectionIds).toBeNull();
        expect(send).not.toHaveBeenCalled();
    });

    test('does not touch the chat from a log that halted', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);
        const state = new GroupState(GROUP_ID);
        state.members.set('carol', new GroupMember('carol', 'carol', ChatPrivileges.Member, 1, [], [], ['carol-device']));
        const chat = { members: [{ userTag: 'bob', privilege: ChatPrivileges.Member }] };

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state, halted: { version: 1, reason: 'bad' } }), groupKeys(), ...chatDependencies(chat));

        await sut.sync(GROUP_ID);

        expect(chat.members.map((member) => member.userTag)).toEqual(['bob']);
    });

    test('fails without touching the log when the server cannot be reached', async () => {
        const log = logRepository();
        const failing: ILedgerProvider = {
            createStream: async () => Result.success<void>(),
            appendEvent: async () => Result.success<void>(),
            archiveStream: async () => Result.success<void>(),
            getEvents: async () => Result.fail(new ErrorMessage('ApiError', 'offline')),
            getHead: async () => Result.fail(new ErrorMessage('ApiError', 'offline')),
        };

        const sut = new LedgerSyncService(failing, log.repository, groupRepository().repository, replayService(), groupKeys(), ...chatDependencies());

        const result = await sut.sync(GROUP_ID);

        expect(result.success).toBe(false);
        expect(log.stored).toEqual([]);
    });

    test('signs every page request with the group write key', async () => {
        const log = logRepository();
        const { provider: p, proofs } = provider([
            { version: 3, archived: false, hasMore: true, events: [event(1), event(2)] },
            { version: 3, archived: false, hasMore: false, events: [event(3)] },
        ]);

        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys(), ...chatDependencies());

        await sut.sync(GROUP_ID);

        expect(proofs).toHaveLength(2);
        for (const proof of proofs) {
            expect(proof.writeKeyPublic).toEqual(WRITE_KEY.publicKey);
            expect(Math.abs(proof.timestamp - Math.floor(Date.now() / 1000))).toBeLessThanOrEqual(5);
            expect(verifyOuter(WRITE_KEY.publicKey, buildReadSigningInput(GROUP_ID, proof.timestamp), proof.signature)).toBe(true);
        }
    });

    test('fails without asking the server when there is no write key for the group', async () => {
        const log = logRepository();
        const { provider: p, requested } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);

        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys(null), ...chatDependencies());

        const result = await sut.sync(GROUP_ID);

        expect(result.success).toBe(false);
        expect(requested).toEqual([]);
        expect(log.stored).toEqual([]);
    });
});
