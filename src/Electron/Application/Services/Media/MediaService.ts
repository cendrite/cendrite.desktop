import { ISessionManager } from '../../../Infrastructure/Interfaces/ISessionManager.js';
import { MediaPointer } from '../../../Infrastructure/Signal/Messaging/ServerMessage.js';
import { Media } from '../../Contracts/Models/Media.js';
import { IMediaProvider } from '../../Contracts/Providers/IMediaProvider.js';
import { MediaType } from '../../Features/Files/Queries/GetMedia/GetMediaQuery.js';

export interface IMediaService {
    getLocal(type: MediaType): Promise<Media[]>;
    get(mediaPointers: MediaPointer[]): Promise<Media[]>;
    upload(senderId: string, media: Media[]): Promise<MediaPointer[]>;
}

export class MediaService implements IMediaService {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly mediaProvider: IMediaProvider,
    ) { }

    getLocal(_type: MediaType): Promise<Media[]> {
        throw new Error('Method not implemented.');
    }

    public async get(mediaPointers: MediaPointer[]): Promise<Media[]> {
        const media: Media[] = [];
        for (const mp of mediaPointers) {
            const result = await this.mediaProvider.get(mp.id);
            if (!result.success) continue;

            const decryptedMedia = await this.sessionManager.decryptBlob(result.data!, mp.key, mp.iv);

            media.push(new Media(mp.id, mp.type, decryptedMedia));
        }
        return media;
    }

    public async upload(senderId: string, media: Media[]): Promise<MediaPointer[]> {
        const mediaPointers: MediaPointer[] = [];
        for (const m of media) {
            const { cipher, key, iv } = await this.sessionManager.encryptBlob(m.content);
            await this.mediaProvider.upload(m.id, senderId, cipher);
            mediaPointers.push(new MediaPointer(m.id, m.type, iv, key));
        }
        return mediaPointers;
    }
}
