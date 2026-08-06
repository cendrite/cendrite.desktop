import { MediaDto } from '../../../Electron/Application/Features/Chat/Dtos/MediaDto';
import { GetMediaQuery, MediaType } from '../../../Electron/Application/Features/Files/Contracts/GetMedia.ts';
import { Result } from '../../../Shared/Result/Result';
import { Media } from '../../Models/Media';

export class MediaService {

    public async getLocalMedia(type: MediaType): Promise<Media[]> {
        const result = await window.electron.sendRequestAsync<Result<MediaDto[]>>(new GetMediaQuery(type));
        if (result.success) {
            return result.data!.map((mediaDto) => new Media(mediaDto.id, mediaDto.type, mediaDto.content));
        } else {
            console.error(result.errorMessage);
            return [];
        }
    }
}
