import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

// CryptographyService uses Electron's safeStorage, which only exists inside a running Electron app.
// Mocking the module keeps it out of the graph entirely rather than stubbing it after it loads.
vi.mock('../../../../../../src/Electron/Infrastructure/Persistence/Encryption/CryptographyService.js', () => ({
    CryptographyService: {
        getInstance: () => ({
            encrypt: async (value: string) => `sealed:${value}`,
            decrypt: async (value: string) => value.replace(/^sealed:/, ''),
        }),
    },
}));

import { initializeDatabase, getDbContext } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { LedgerLogRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/LedgerLogRepository.js';
import { GroupRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/GroupRepository.js';
import { GroupKeyRepository } from '../../../../../../src/Electron/Infrastructure/Persistence/Repositories/GroupKeyRepository.js';
import { LedgerEventRecord } from '../../../../../../src/Electron/Domain/Entities/LedgerEventRecord.js';
import { LedgerEventStatus } from '../../../../../../src/Electron/Domain/Enums/LedgerEventStatus.js';
import { Group } from '../../../../../../src/Electron/Domain/Entities/Group.js';
import { GroupLifecycle } from '../../../../../../src/Electron/Domain/Enums/GroupLifecycle.js';
import { GroupWriteKey } from '../../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import { GroupEpochKey } from '../../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const OTHER_GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e11';

beforeAll(async () => {
    await initializeDatabase(':memory:');
});

beforeEach(async () => {
    await new LedgerLogRepository().deleteAll();
    await new GroupRepository().deleteAll();
    await new GroupKeyRepository().deleteAll();
});

function record(version: number, status = LedgerEventStatus.Applied, groupId = GROUP_ID): LedgerEventRecord {
    return new LedgerEventRecord(
        groupId,
        version,
        Buffer.alloc(32, version),
        Buffer.from([version, 0x0a]),
        Buffer.alloc(32, 0xa1),
        Buffer.alloc(64, 0x7f),
        Buffer.alloc(32, 0xfe),
        [Buffer.alloc(32, 0xb2).toString('base64')],
        [],
        status,
    );
}

describe('LedgerLogRepository', () => {
    test('round trips an event with its buffers and key lists intact', async () => {
        const sut = new LedgerLogRepository();
        await sut.append([record(1)]);

        const [stored] = await sut.getAll(GROUP_ID);

        expect(stored.version).toBe(1);
        expect(Buffer.from(stored.payload)).toEqual(Buffer.from([1, 0x0a]));
        expect(Buffer.from(stored.previousHash)).toEqual(Buffer.alloc(32, 1));
        expect(Buffer.from(stored.signature)).toHaveLength(64);
        expect(stored.keysAdded).toEqual([Buffer.alloc(32, 0xb2).toString('base64')]);
        expect(stored.keysRemoved).toEqual([]);
        expect(stored.status).toBe(LedgerEventStatus.Applied);
    });

    test('returns events in version order from a given point', async () => {
        const sut = new LedgerLogRepository();
        await sut.append([record(3), record(1), record(2)]);

        const events = await sut.getFrom(GROUP_ID, 2);

        expect(events.map((e) => e.version)).toEqual([2, 3]);
    });

    test('keeps groups apart', async () => {
        const sut = new LedgerLogRepository();
        await sut.append([record(1), record(1, LedgerEventStatus.Applied, OTHER_GROUP_ID)]);

        expect(await sut.getAll(GROUP_ID)).toHaveLength(1);
        expect(await sut.getLastVersion(OTHER_GROUP_ID)).toBe(1);
    });

    test('reports no last version for an unknown group', async () => {
        expect(await new LedgerLogRepository().getLastVersion(GROUP_ID)).toBe(0);
    });

    test('records why an event was rejected', async () => {
        const sut = new LedgerLogRepository();
        await sut.append([record(1)]);

        await sut.setStatus(GROUP_ID, 1, LedgerEventStatus.Rejected, 'author is not an admin');

        const [stored] = await sut.getAll(GROUP_ID);
        expect(stored.status).toBe(LedgerEventStatus.Rejected);
        expect(stored.rejectReason).toBe('author is not an admin');
    });

    test('appending nothing is a no-op', async () => {
        await new LedgerLogRepository().append([]);
        expect(await new LedgerLogRepository().getAll(GROUP_ID)).toEqual([]);
    });
});

describe('GroupRepository', () => {
    test('round trips a group record', async () => {
        const sut = new GroupRepository();
        await sut.create(new Group(GROUP_ID, GroupLifecycle.Active, 7, Buffer.alloc(32, 0x5a), 2, false, 'abc'));

        const stored = await sut.get(GROUP_ID);

        expect(stored!.lifecycle).toBe(GroupLifecycle.Active);
        expect(stored!.version).toBe(7);
        expect(Buffer.from(stored!.headHash)).toEqual(Buffer.alloc(32, 0x5a));
        expect(stored!.epoch).toBe(2);
        expect(stored!.publishedDevicesHash).toBe('abc');
    });

    test('defaults a new group to draft at version zero', async () => {
        const sut = new GroupRepository();
        await sut.create(new Group(GROUP_ID));

        const stored = await sut.get(GROUP_ID);

        expect(stored!.lifecycle).toBe(GroupLifecycle.Draft);
        expect(stored!.version).toBe(0);
        expect(Buffer.from(stored!.headHash)).toEqual(Buffer.alloc(32));
    });

    test('finds groups by lifecycle', async () => {
        const sut = new GroupRepository();
        await sut.create(new Group(GROUP_ID, GroupLifecycle.Active));
        await sut.create(new Group(OTHER_GROUP_ID, GroupLifecycle.Draft));

        const active = await sut.getByLifecycle(GroupLifecycle.Active);

        expect(active.map((g) => g.groupId)).toEqual([GROUP_ID]);
    });

    test('returns null for an unknown group', async () => {
        expect(await new GroupRepository().get(GROUP_ID)).toBeNull();
    });
});

describe('GroupKeyRepository', () => {
    test('round trips a write key', async () => {
        const sut = new GroupKeyRepository();
        const privateKey = Buffer.alloc(32, 0x42);
        await sut.saveWriteKey(new GroupWriteKey(GROUP_ID, Buffer.alloc(32, 0xa1), privateKey));

        const stored = await sut.getWriteKey(GROUP_ID);

        expect(Buffer.from(stored!.publicKey)).toEqual(Buffer.alloc(32, 0xa1));
        expect(Buffer.from(stored!.privateKey)).toEqual(privateKey);
    });

    test('never writes the private key in the clear', async () => {
        const sut = new GroupKeyRepository();
        const privateKey = Buffer.alloc(32, 0x42);
        await sut.saveWriteKey(new GroupWriteKey(GROUP_ID, Buffer.alloc(32, 0xa1), privateKey));

        const raw = await getDbContext().getRepository(GroupWriteKey).findOneBy({ groupId: GROUP_ID });

        expect(Buffer.from(raw!.privateKey).toString('utf8')).toBe(`sealed:${privateKey.toString('base64')}`);
        expect(Buffer.from(raw!.privateKey)).not.toEqual(privateKey);
    });

    test('keeps one key per epoch and returns them all', async () => {
        const sut = new GroupKeyRepository();
        await sut.saveEpochKey(new GroupEpochKey(GROUP_ID, 1, Buffer.alloc(32, 0x01)));
        await sut.saveEpochKey(new GroupEpochKey(GROUP_ID, 2, Buffer.alloc(32, 0x02)));

        const first = await sut.getEpochKey(GROUP_ID, 1);
        const all = await sut.getEpochKeys(GROUP_ID);

        expect(Buffer.from(first!.key)).toEqual(Buffer.alloc(32, 0x01));
        expect(all.map((k) => k.epoch).sort()).toEqual([1, 2]);
    });

    test('returns null for keys it does not have', async () => {
        const sut = new GroupKeyRepository();

        expect(await sut.getWriteKey(GROUP_ID)).toBeNull();
        expect(await sut.getEpochKey(GROUP_ID, 9)).toBeNull();
    });
});
