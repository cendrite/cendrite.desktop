import { Media } from '../../Application/Contracts/Models/Media.js';
import { IMediaProvider } from '../../Application/Contracts/Providers/IMediaProvider.js';
import { ISessionManager } from '../Interfaces/ISessionManager.js';
import { MediaPointer } from '../Signal/Messaging/ServerMessage.js';
import { ApiClient } from './Base/ApiClient.js';

export class MediaProvider implements IMediaProvider {
    private readonly client: ApiClient;
    private readonly sessionManager: ISessionManager;

    constructor(mediaApiClient: ApiClient, sessionManager: ISessionManager) {
        this.client = mediaApiClient;
        this.sessionManager = sessionManager;
    }

    public async upload(senderId: string, media: Media[]): Promise<MediaPointer[]> {
        const mediaPointers: MediaPointer[] = [];
        for (const m of media) {
            const { cipher, key, iv } = await this.sessionManager.encryptBlob(m.content);
            await this.client.handleConduit({
                method: 'POST',
                params: { id: m.id, senderId },
                data: cipher,
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
            });
            mediaPointers.push(new MediaPointer(m.id, m.type, iv, key));
        }
        return mediaPointers;
    }

    public async get(pointers: MediaPointer[]): Promise<Media[]> {
        const media: Media[] = [];
        for (const pointer of pointers) {
            const result = await this.client.handleConduit<ArrayBuffer>({
                method: 'GET',
                params: { id: pointer.id },
                responseType: 'arraybuffer',
            });

            if (!result.success) {
                console.error(`Failed to fetch media with ID ${pointer.id}: ${result.errorMessage}`);
                continue;
            }

            const decryptedMedia = await this.sessionManager.decryptBlob(
                new Uint8Array(result.data!),
                pointer.key,
                pointer.iv,
            );
            media.push(new Media(pointer.id, pointer.type, decryptedMedia));
        }
        return media;
    }
}
