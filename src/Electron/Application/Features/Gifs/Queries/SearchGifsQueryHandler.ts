import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGifProvider } from '#electron/Application/Contracts/Providers/IGifProvider';
import { GIF_PAGE_SIZE, GifPage, SearchGifsQuery } from '#shared/Gifs/SearchGifs';

export class SearchGifsQueryHandler implements Handler<SearchGifsQuery, GifPage> {
    constructor(private readonly gifProvider: IGifProvider) {}

    public async handle(query: SearchGifsQuery): Promise<Result<GifPage>> {
        const result = await this.gifProvider.search(query.query, Math.max(0, query.offset), GIF_PAGE_SIZE);
        if (!result.success) return result;

        return Result.success({
            gifs: result.data.gifs.map((gif) => ({
                id: gif.id,
                title: gif.title,
                width: gif.preview.width,
                height: gif.preview.height,
                previewType: gif.previewType,
                previewUrl: gif.preview.url,
            })),
            nextOffset: result.data.nextOffset,
        });
    }
}
