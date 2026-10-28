import { afterAll, describe, expect, test, vi } from 'vitest';
import { mkdtempSync } from 'fs';
import { readdir, rm, writeFile, mkdir } from 'fs/promises';
import os from 'os';
import path from 'path';

const userData = mkdtempSync(path.join(os.tmpdir(), 'cypherly-media-'));

vi.mock('electron', () => ({
    app: { getPath: () => userData },
}));

const { MediaStore } = await import('../../../../../../src/Electron/Infrastructure/Persistence/Store/MediaStore.js');

afterAll(async () => {
    await rm(userData, { recursive: true, force: true });
});

describe('MediaStore.clear', () => {
    test('removes every stored file and keeps the media folder', async () => {
        const sut = new MediaStore();
        await sut.store('a', new Uint8Array([1, 2, 3]));
        await sut.store('b', new Uint8Array([4]));
        await mkdir(path.join(userData, 'media', 'nested'));
        await writeFile(path.join(userData, 'media', 'nested', 'c'), 'x');

        await sut.clear();

        expect(await readdir(path.join(userData, 'media'))).toEqual([]);
    });
});
