import { MediaContract } from '../../../Shared/Models/MediaContract.ts';
import { GetMediaQuery, MediaType } from '../../../Shared/Files/GetMedia.ts';
import { Result } from '../../../Shared/Result/Result';
import { Media } from '../../Models/Media';

export class MediaService {

    public async getLocalMedia(type: MediaType): Promise<Media[]> {
        const result = await window.electron.sendRequestAsync<Result<MediaContract[]>>(new GetMediaQuery(type));
        if (result.success) {
            return result.data.map((mediaDto) => new Media(mediaDto.id, mediaDto.type, mediaDto.content));
        } else {
            console.error(result.errorMessage);
            return [];
        }
    }
}
