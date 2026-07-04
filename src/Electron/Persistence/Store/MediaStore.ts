import { app } from "electron";
import path from "path";
import { Media } from "../../Application/Features/Files/Dto/Media.js";

interface IMediaStore {
    StoreAsync: (media: any) => Promise<void>;
    GetAsync: (mediaId: string) => Promise<any>;
    DeleteAsync: (mediaId: string) => Promise<void>;
}

export class MediaStore implements IMediaStore {
    private path = path.join(app.getPath('userData'), 'media');

    constructor() {
    }

    async StoreAsync(media: Media): Promise<void> {
        throw new Error("Method not implemented.");

    }

    async GetAsync(mediaId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async DeleteAsync(mediaId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
