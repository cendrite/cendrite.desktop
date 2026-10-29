import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGifProvider } from '#electron/Application/Contracts/Providers/IGifProvider';
import { GIF_PAGE_SIZE, GifPage, GifPreview, SearchGifsQuery } from '#shared/Gifs/SearchGifs';

// Previews are fetched here rather than by the renderer, so the page's CSP stays closed to third-party hosts.
export class SearchGifsQueryHandler implements Handler<SearchGifsQuery, GifPage> {
    constructor(private readonly gifProvider: IGifProvider) {}

    public async handle(query: SearchGifsQuery): Promise<Result<GifPage>> {
        const result = await this.gifProvider.search(query.query, Math.max(0, query.offset), GIF_PAGE_SIZE);
        if (!result.success) return result;

        const previews = await Promise.all(
            result.data.gifs.map(async (gif): Promise<GifPreview | null> => {
                const download = await this.gifProvider.download(gif.preview.url);
                if (!download.success) return null;

                return {
                    id: gif.id,
                    title: gif.title,
                    width: gif.preview.width,
                    height: gif.preview.height,
                    previewType: gif.previewType,
                    preview: download.data,
                };
            }),
        );

        return Result.success({
            gifs: previews.filter((gif): gif is GifPreview => gif !== null),
            nextOffset: result.data.nextOffset,
        });
    }
}
