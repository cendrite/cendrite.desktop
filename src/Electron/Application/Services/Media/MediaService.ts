import { ISessionManager } from '../../Contracts/Services/ISessionManager.js';
import { MediaPointer } from '../../Contracts/Messaging/Envelope.js';
import { MediaContract } from '../../Contracts/Models/MediaContract.js';
import { IMediaProvider } from '../../Contracts/Providers/IMediaProvider.js';
import { MediaType } from '../../Features/Files/Contracts/GetMedia.js';

export interface IMediaService {
    getLocal(type: MediaType): Promise<MediaContract[]>;
    get(mediaPointers: MediaPointer[]): Promise<MediaContract[]>;
    upload(media: MediaContract[]): Promise<MediaPointer[]>;
}

export class MediaService implements IMediaService {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly mediaProvider: IMediaProvider,
    ) { }

    getLocal(_type: MediaType): Promise<MediaContract[]> {
        throw new Error('Method not implemented.');
    }

    public async get(mediaPointers: MediaPointer[]): Promise<MediaContract[]> {
        const media: MediaContract[] = [];
        for (const mp of mediaPointers) {
            const result = await this.mediaProvider.get(mp.id);
            if (!result.success) continue;

            const decryptedMedia = await this.sessionManager.decryptBlob(result.data!, mp.key, mp.iv);

            media.push(new MediaContract(mp.id, mp.type, decryptedMedia));
        }
        return media;
    }

    public async upload(media: MediaContract[]): Promise<MediaPointer[]> {
        const mediaPointers: MediaPointer[] = [];
        for (const m of media) {
            const { cipher, key, iv } = await this.sessionManager.encryptBlob(m.content);
            await this.mediaProvider.upload(m.id, cipher);
            mediaPointers.push(new MediaPointer(m.id, m.type, iv, key));
        }
        return mediaPointers;
    }
}
