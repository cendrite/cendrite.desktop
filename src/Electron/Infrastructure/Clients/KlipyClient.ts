import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { GifErrorCode } from '#shared/Gifs/SearchGifs';
import {
    GifRendition,
    GifResult,
    GifSearchPage,
    IGifProvider,
} from '#electron/Application/Contracts/Providers/IGifProvider';
import { API_URLS } from './Base/Urls.js';

type KlipyFile = { url?: string; width?: number; height?: number };

type KlipyFormats = { gif?: KlipyFile; webp?: KlipyFile };

type KlipyGif = {
    slug: string;
    title?: string;
    type?: string;
    file?: { hd?: KlipyFormats; md?: KlipyFormats; sm?: KlipyFormats; xs?: KlipyFormats };
};

type KlipyPage = { result?: boolean; data?: { data?: KlipyGif[]; has_next?: boolean } };

const CONTENT_FILTER = 'medium';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;

// Speaks to KLIPY directly from the main process. No customer id is sent, so searches aren't tied to a user,
// and nothing about what the user searched for outlives the request.
export class KlipyClient implements IGifProvider {
    constructor(
        private readonly apiKey: string,
        private readonly fetchFn: typeof fetch = fetch,
    ) {}

    public isConfigured(): boolean {
        return this.apiKey.length > 0;
    }

    // KLIPY pages by number; the offset callers use is always a whole number of pages.
    public async search(query: string, offset: number, limit: number): Promise<Result<GifSearchPage>> {
        const trimmed = query.trim().slice(0, 50);
        const params: Record<string, string> = {
            page: String(Math.floor(offset / limit) + 1),
            per_page: String(limit),
            content_filter: CONTENT_FILTER,
        };
        if (trimmed) params.q = trimmed;

        const result = await this.request(trimmed ? 'search' : 'trending', params);
        if (!result.success) return result;

        const { data = [], has_next } = result.data;
        return Result.success({
            gifs: data.map((gif) => this.toResult(gif)).filter((gif): gif is GifResult => gif !== null),
            nextOffset: has_next ? offset + limit : null,
        });
    }

    public async getById(id: string): Promise<Result<GifResult>> {
        if (!/^[A-Za-z0-9_-]+$/.test(id)) {
            return Result.fail(new ErrorMessage('GifNotFound', 'GIF not found'));
        }

        const result = await this.request('items', { slugs: id });
        if (!result.success) return result;

        const match = result.data.data?.find((gif) => gif.slug === id);
        const gif = match && this.toResult(match);
        return gif ? Result.success(gif) : Result.fail(new ErrorMessage('GifNotFound', 'GIF not found'));
    }

    public async download(url: string): Promise<Result<Uint8Array>> {
        if (!this.isKlipyMedia(url)) {
            return Result.fail(new ErrorMessage('GifDownloadFailed', 'Refusing to download from outside KLIPY'));
        }

        try {
            const response = await this.fetchFn(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
            if (!response.ok) {
                return Result.fail(new ErrorMessage('GifDownloadFailed', `GIF download failed (${response.status})`));
            }

            const declared = Number(response.headers.get('content-length') ?? 0);
            if (declared > MAX_DOWNLOAD_BYTES) {
                return Result.fail(new ErrorMessage('GifDownloadFailed', 'GIF is too large'));
            }

            const bytes = new Uint8Array(await response.arrayBuffer());
            if (bytes.length > MAX_DOWNLOAD_BYTES) {
                return Result.fail(new ErrorMessage('GifDownloadFailed', 'GIF is too large'));
            }

            return Result.success(bytes);
        } catch (error) {
            console.error('GIF download failed:', error);
            return Result.fail(new ErrorMessage('GifDownloadFailed', 'GIF download failed'));
        }
    }

    private async request(
        path: string,
        params: Record<string, string>,
    ): Promise<Result<NonNullable<KlipyPage['data']>>> {
        if (!this.isConfigured()) {
            return Result.fail(new ErrorMessage(GifErrorCode.Unavailable, 'GIF search is not configured'));
        }

        const url = new URL(`${API_URLS.KLIPY.BASE}/${encodeURIComponent(this.apiKey)}/gifs/${path}`);
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await this.fetchFn(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

            if (response.status === 429) {
                return Result.fail(
                    new ErrorMessage(GifErrorCode.RateLimited, 'Too many GIF searches, try again later'),
                );
            }
            // The key is in the path, so log the endpoint and status rather than the URL.
            if (!response.ok) {
                console.error('KLIPY request failed:', path, response.status);
                return Result.fail(new ErrorMessage('GifRequestFailed', 'Could not reach KLIPY'));
            }

            const body = (await response.json()) as KlipyPage;
            if (!body.result || !body.data) {
                console.error('KLIPY request failed:', path, 'result=false');
                return Result.fail(new ErrorMessage('GifRequestFailed', 'Could not reach KLIPY'));
            }

            return Result.success(body.data);
        } catch (error) {
            console.error('KLIPY request failed:', error instanceof Error ? error.name : 'unknown error');
            return Result.fail(new ErrorMessage('GifRequestFailed', 'Could not reach KLIPY'));
        }
    }

    // Ad items only appear when ads are enabled for the key; they are skipped rather than shown.
    private toResult(gif: KlipyGif): GifResult | null {
        if (gif.type === 'ad' || !gif.file) return null;

        const previewFormats = gif.file.sm ?? gif.file.xs ?? gif.file.md;
        const preview = this.rendition(previewFormats?.webp) ?? this.rendition(previewFormats?.gif);
        const send = this.rendition((gif.file.md ?? gif.file.hd ?? gif.file.sm)?.gif);
        if (!preview || !send) return null;

        return {
            id: gif.slug,
            title: gif.title || 'GIF',
            preview,
            previewType: preview.url === previewFormats?.webp?.url ? 'image/webp' : 'image/gif',
            send,
        };
    }

    // Sends stay GIF so the existing metadata stripper can clean them without flattening the animation.
    private rendition(file: KlipyFile | undefined): GifRendition | null {
        const width = Number(file?.width);
        const height = Number(file?.height);
        if (!file?.url || !this.isKlipyMedia(file.url) || !(width > 0) || !(height > 0)) return null;
        return { url: file.url, width, height };
    }

    private isKlipyMedia(url: string): boolean {
        try {
            const parsed = new URL(url);
            return (
                parsed.protocol === 'https:' &&
                API_URLS.KLIPY.MEDIA_HOST_SUFFIXES.some((suffix) => parsed.hostname.endsWith(suffix))
            );
        } catch {
            return false;
        }
    }
}
