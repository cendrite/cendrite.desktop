import { randomUUID } from 'node:crypto';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGifProvider } from '#electron/Application/Contracts/Providers/IGifProvider';
import { IMetaDataStripper } from '#electron/Application/Contracts/Services/IMetaDataStripper';
import { GetGifQuery } from '#shared/Gifs/GetGif';
import { MediaContract } from '#shared/Models/MediaContract';

// Looked up by id again rather than trusting a URL from the renderer, then re-sent as ordinary encrypted
// media so the recipient never contacts GIPHY.
export class GetGifQueryHandler implements Handler<GetGifQuery, MediaContract> {
    constructor(
        private readonly gifProvider: IGifProvider,
        private readonly mediaMetadataStripper: IMetaDataStripper,
    ) {}

    public async handle(query: GetGifQuery): Promise<Result<MediaContract>> {
        const gif = await this.gifProvider.getById(query.id);
        if (!gif.success) return gif;

        const download = await this.gifProvider.download(gif.data.send.url);
        if (!download.success) return download;

        try {
            const content = this.mediaMetadataStripper.strip(Buffer.from(download.data), 'image/gif');
            return Result.success(new MediaContract(randomUUID(), 'image/gif', content));
        } catch (error) {
            console.error('GIF could not be prepared:', error instanceof Error ? error.message : error);
            return Result.fail(new ErrorMessage('GifDownloadFailed', 'GIF could not be prepared'));
        }
    }
}
