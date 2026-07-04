import { MediaDto } from '../../../Electron/Application/Features/Chat/Dtos/MediaDto';
import { GetMediaQuery, MediaType } from '../../../Electron/Application/Features/Files/Queries/GetMedia/GetMediaQuery';
import { Result } from '../../../Shared/Result/Result';
import { Media } from '../../Models/Media';
import { SessionManager } from '../../Security/Encryption/SessionManager';
import { MediaPointer } from '../../SignalR/Messaging/ServerMessage';
import { MediaApi } from '../Api/ChatServer/MediaApi';

export class MediaService {
    private readonly mediaApi = new MediaApi();

    public async getLocalMedia(type: MediaType): Promise<Media[]> {
        const result = await window.electron.sendRequestAsync<Result<MediaDto[]>>(new GetMediaQuery(type));
        if (result.success) {
            return result.data!.map((mediaDto) => new Media(mediaDto.id, mediaDto.type, mediaDto.content));
        } else {
            console.error(result.errorMessage);
            return [];
        }
    }

    public async getMedia(mediaPointers: MediaPointer[]): Promise<Media[]> {
        const media: Media[] = [];
        for (const mp of mediaPointers) {
            const result = await this.mediaApi.get(mp.id)
            if(!result.success) 
                continue;

            const decryptedMedia = await SessionManager.decryptBlob(result.data!, mp.key, mp.iv);

            media.push(new Media(mp.id, mp.type, decryptedMedia))
        }
        return media;
    }

    public async uploadMedia(senderId: string, media: Media[]): Promise<MediaPointer[]> {
        const mediaPointers: MediaPointer[] = [];
        for (const m of media) {
            const { cipher, key, iv } = await SessionManager.encryptBlob(m.content);
            await this.mediaApi.upload(m.id, senderId, cipher);
            mediaPointers.push(new MediaPointer(m.id, m.type, iv, key));
        }
        return mediaPointers;
    }
}
