import { afterAll, describe, expect, test } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { getDbContext, initializeDatabase } from '../../../../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';
import { OutboxEvent } from '../../../../../../src/Electron/Infrastructure/Models/OutboxEvent.js';

const dir = await mkdtemp(path.join(os.tmpdir(), 'cendrite-db-'));
const dbPath = path.join(dir, 'msg.sqlite');

afterAll(async () => {
    await getDbContext().destroy();
    await rm(dir, { recursive: true, force: true });
});

describe('legacy data on startup', () => {
    test('processed outbox events and the refresh_token table are removed, pending events kept', async () => {
        const first = await initializeDatabase(dbPath);
        await first.getRepository(OutboxEvent).save([
            new OutboxEvent('processed', 'MessageSentEvent', '{"strap":"secret"}', new Date(), new Date()),
            new OutboxEvent('pending', 'MessageSentEvent', '{}', new Date()),
        ]);
        await first.query('CREATE TABLE "refresh_token" ("id" varchar PRIMARY KEY NOT NULL, "token" text NOT NULL)');
        await first.query(`INSERT INTO "refresh_token" ("id", "token") VALUES ('1', 'old')`);
        await first.destroy();

        const reopened = await initializeDatabase(dbPath);

        expect((await reopened.getRepository(OutboxEvent).find()).map((e) => e.id)).toEqual(['pending']);
        const tables = await reopened.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='refresh_token'`);
        expect(tables).toEqual([]);
    });
});
