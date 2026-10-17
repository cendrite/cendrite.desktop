import { describe, expect, test } from 'vitest';
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
    );
}

function logRepository(existing: LedgerEventRecord[] = []) {
    const stored = [...existing];
    const statuses: { version: number; status: LedgerEventStatus; reason: string | null }[] = [];

    const repository: ILedgerLogRepository = {
        append: async (records) => void stored.push(...records),
        getFrom: async (_groupId, from) => stored.filter((r) => r.version >= from),
        getAll: async () => stored,
        getLastVersion: async () => stored.reduce((max, r) => Math.max(max, r.version), 0),
        setStatus: async (_groupId, version, status, reason = null) => void statuses.push({ version, status, reason }),
        deleteAll: async () => void (stored.length = 0),
    };

    return { repository, stored, statuses };
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
            ({ rejected: [], halted: null, stalledAt: null, ...result, state }) as ReplayResult,
    };
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
        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService({ state }), groupKeys());

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
        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys());

        await sut.sync(GROUP_ID);

        expect(requested).toEqual([2]);
    });

    test('keeps paging while the server says there is more', async () => {
        const log = logRepository();
        const { provider: p, requested } = provider([
            { version: 3, archived: false, hasMore: true, events: [event(1), event(2)] },
            { version: 3, archived: false, hasMore: false, events: [event(3)] },
        ]);

        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys());

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
            groupKeys(),
        );

        await sut.sync(GROUP_ID);

        expect(log.statuses).toEqual([
            { version: 1, status: LedgerEventStatus.Rejected, reason: 'author is not an admin' },
        ]);
    });

    test('marks a stall so it can be resumed when the key arrives', async () => {
        const log = logRepository();
        const { provider: p } = provider([{ version: 1, archived: false, hasMore: false, events: [event(1)] }]);

        const sut = new LedgerSyncService(
            p,
            log.repository,
            groupRepository().repository,
            replayService({ stalledAt: 1 }),
            groupKeys(),
        );

        await sut.sync(GROUP_ID);

        expect(log.statuses[0]).toEqual({ version: 1, status: LedgerEventStatus.Stalled, reason: null });
    });

    test('records that the group was archived', async () => {
        const log = logRepository();
        const groups = groupRepository();
        const { provider: p } = provider([{ version: 1, archived: true, hasMore: false, events: [event(1)] }]);

        const sut = new LedgerSyncService(p, log.repository, groups.repository, replayService(), groupKeys());

        await sut.sync(GROUP_ID);

        expect(groups.saved[0].archived).toBe(true);
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

        const sut = new LedgerSyncService(failing, log.repository, groupRepository().repository, replayService(), groupKeys());

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

        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys());

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

        const sut = new LedgerSyncService(p, log.repository, groupRepository().repository, replayService(), groupKeys(null));

        const result = await sut.sync(GROUP_ID);

        expect(result.success).toBe(false);
        expect(requested).toEqual([]);
        expect(log.stored).toEqual([]);
    });
});
