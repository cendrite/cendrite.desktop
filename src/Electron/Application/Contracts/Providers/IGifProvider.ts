import { Result } from '#shared/Result/Result';

export interface GifRendition {
    url: string;
    width: number;
    height: number;
}

export interface GifResult {
    id: string;
    title: string;
    preview: GifRendition;
    previewType: string;
    send: GifRendition;
}

export interface GifSearchPage {
    gifs: GifResult[];
    nextOffset: number | null;
}

export interface IGifProvider {
    isConfigured(): boolean;
    search(query: string, offset: number, limit: number): Promise<Result<GifSearchPage>>;
    getById(id: string): Promise<Result<GifResult>>;
    download(url: string): Promise<Result<Uint8Array>>;
}
