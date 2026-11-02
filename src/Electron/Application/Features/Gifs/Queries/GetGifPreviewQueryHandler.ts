import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGifProvider } from '#electron/Application/Contracts/Providers/IGifProvider';
import { GetGifPreviewQuery } from '#shared/Gifs/GetGifPreview';

export class GetGifPreviewQueryHandler implements Handler<GetGifPreviewQuery, Uint8Array> {
    constructor(private readonly gifProvider: IGifProvider) {}

    public async handle(query: GetGifPreviewQuery): Promise<Result<Uint8Array>> {
        return this.gifProvider.download(query.url);
    }
}
