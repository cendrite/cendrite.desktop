export const GIF_PAGE_SIZE = 24;

export const GifErrorCode = {
    Unavailable: 'GifsUnavailable',
    RateLimited: 'GifsRateLimited',
} as const;

// An empty query returns trending GIFs.
export class SearchGifsQuery implements MediatorRequest<GifPage> {
    declare readonly _response?: GifPage;
    public readonly type = 'SearchGifsQuery';
    constructor(
        public readonly query: string,
        public readonly offset: number,
    ) {}
}

export interface GifPreview {
    id: string;
    title: string;
    width: number;
    height: number;
    previewType: string;
    preview: Uint8Array;
}

export interface GifPage {
    gifs: GifPreview[];
    nextOffset: number | null;
}
