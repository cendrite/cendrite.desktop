import { app } from 'electron';
import path from 'path';
import { writeFile, readFile, unlink } from 'fs/promises';
import { mkdirSync } from 'fs';

export class MediaStore {
    private path = path.join(app.getPath('userData'), 'media');
    private static instance: MediaStore;

    private constructor() {
        mkdirSync(this.path, { recursive: true });
    }

    public static getInstance(): MediaStore {
        if (!MediaStore.instance) {
            MediaStore.instance = new MediaStore();
        }
        return MediaStore.instance;
    }

    async store(id: string, content: Buffer): Promise<void> {
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
}
