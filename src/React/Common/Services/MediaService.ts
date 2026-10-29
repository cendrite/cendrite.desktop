import { GetMediaQuery, MediaType } from '@/Shared/Files/GetMedia.ts';
import { Media } from '@/React/Models/Media';
import { GetGifQuery } from '@/Shared/Gifs/GetGif.ts';

export class MediaService {

    public async getLocalMedia(type: MediaType): Promise<Media[]> {
        const result = await window.electron.sendRequestAsync(new GetMediaQuery(type));
        if (result.success) {
            return result.data.map((mediaDto) => new Media(mediaDto.id, mediaDto.type, mediaDto.content));
        } else {
            console.error(result.errorMessage);
            return [];
        }
    }

    public async getGif(id: string): Promise<Media | null> {
        const result = await window.electron.sendRequestAsync(new GetGifQuery(id));
        if (!result.success) {
            console.error(result.errorMessage);
            return null;
        }
        return new Media(result.data.id, result.data.type, result.data.content);
    }
}
