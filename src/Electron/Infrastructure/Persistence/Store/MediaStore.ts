import { app } from 'electron';
import path from 'path';
import { writeFile, readFile, unlink, readdir, rm } from 'fs/promises';
import { mkdirSync } from 'fs';
import { IMediaStore } from '#electron/Application/Contracts/Repositories/IMediaStore';

export class MediaStore implements IMediaStore {
    private path = path.join(app.getPath('userData'), 'media');

    public constructor() {
        mkdirSync(this.path, { recursive: true });
    }

    async store(id: string, content: Uint8Array): Promise<void> {
        const filePath = path.join(this.path, id);
        await writeFile(filePath, content);
    }

    async get(mediaId: string): Promise<Buffer> {
        const filePath = path.join(this.path, mediaId);
        return await readFile(filePath);
    }

    async delete(mediaId: string): Promise<void> {
        const filePath = path.join(this.path, mediaId);
        await unlink(filePath);
    }

    async clear(): Promise<void> {
        const files = await readdir(this.path);
        await Promise.all(files.map((file) => rm(path.join(this.path, file), { force: true, recursive: true })));
    }
}
