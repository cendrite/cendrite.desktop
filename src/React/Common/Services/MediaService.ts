import { GetMediaQuery, MediaType } from '@/Shared/Files/GetMedia.ts';
import { Media } from '@/React/Models/Media';

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
}
