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

type GiphyRendition = { url?: string; webp?: string; width?: string; height?: string };

type GiphyGif = {
    id: string;
    title?: string;
    alt_text?: string;
    images: Record<string, GiphyRendition | undefined>;
};

type GiphyPagination = { offset: number; count: number; total_count?: number };

const RATING = 'pg-13';
const LANGUAGE = 'en';
const REQUEST_TIMEOUT_MS = 10_000;
// GIPHY's "downsized" rendition is documented as under 2MB; anything far beyond that is not a GIF we asked for.
const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;
// GIPHY caps the offset for trending lower than for search.
const MAX_OFFSET = { search: 4999, trending: 499 };

// Speaks to GIPHY directly from the main process. Results and media are never cached: GIPHY's terms forbid it,
// and nothing about what the user searched for should outlive the request.
export class GiphyClient implements IGifProvider {
    constructor(
        private readonly apiKey: string,
        private readonly fetchFn: typeof fetch = fetch,
    ) {}

    public isConfigured(): boolean {
        return this.apiKey.length > 0;
    }

    public async search(query: string, offset: number, limit: number): Promise<Result<GifSearchPage>> {
        const trimmed = query.trim().slice(0, 50);
        const endpoint = trimmed ? 'search' : 'trending';
        const params: Record<string, string> = { limit: String(limit), offset: String(offset), rating: RATING };
        if (trimmed) {
            params.q = trimmed;
            params.lang = LANGUAGE;
        }

        const result = await this.request<{ data: GiphyGif[]; pagination: GiphyPagination }>(endpoint, params);
        if (!result.success) return result;

        const { data, pagination } = result.data;
        const next = pagination.offset + pagination.count;
        const exhausted =
            pagination.count === 0 ||
            (pagination.total_count !== undefined && next >= pagination.total_count) ||
            next > MAX_OFFSET[endpoint];

        return Result.success({
            gifs: data.map((gif) => this.toResult(gif)).filter((gif): gif is GifResult => gif !== null),
            nextOffset: exhausted ? null : next,
        });
    }

    public async getById(id: string): Promise<Result<GifResult>> {
        if (!/^[A-Za-z0-9]+$/.test(id)) {
            return Result.fail(new ErrorMessage('GifNotFound', 'GIF not found'));
        }

        const result = await this.request<{ data: GiphyGif }>(id, {});
        if (!result.success) return result;

        const gif = this.toResult(result.data.data);
        return gif ? Result.success(gif) : Result.fail(new ErrorMessage('GifNotFound', 'GIF not found'));
    }

    public async download(url: string): Promise<Result<Uint8Array>> {
        if (!this.isGiphyMedia(url)) {
            return Result.fail(new ErrorMessage('GifDownloadFailed', 'Refusing to download from outside GIPHY'));
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

    private async request<T>(path: string, params: Record<string, string>): Promise<Result<T>> {
        if (!this.isConfigured()) {
            return Result.fail(new ErrorMessage(GifErrorCode.Unavailable, 'GIF search is not configured'));
        }

        const url = new URL(`${API_URLS.GIPHY.GIFS}/${path}`);
        url.search = new URLSearchParams({ api_key: this.apiKey, ...params }).toString();

        try {
            const response = await this.fetchFn(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

            if (response.status === 429) {
                return Result.fail(
                    new ErrorMessage(GifErrorCode.RateLimited, 'Too many GIF searches, try again later'),
                );
            }
            if (!response.ok) {
                // The key is in the query string, so log the status rather than the URL.
                console.error(
                    'GIPHY request failed:',
                    path === 'search' || path === 'trending' ? path : 'gif',
                    response.status,
                );
                return Result.fail(new ErrorMessage('GifRequestFailed', 'Could not reach GIPHY'));
            }

            return Result.success((await response.json()) as T);
        } catch (error) {
            console.error('GIPHY request failed:', error instanceof Error ? error.name : 'unknown error');
            return Result.fail(new ErrorMessage('GifRequestFailed', 'Could not reach GIPHY'));
        }
    }

    private toResult(gif: GiphyGif): GifResult | null {
        const previewSource = gif.images.fixed_width_small ?? gif.images.fixed_width;
        const preview = this.rendition(previewSource, true);
        const send = this.rendition(gif.images.downsized ?? gif.images.fixed_height ?? gif.images.original, false);
        if (!preview || !send) return null;

        return {
            id: gif.id,
            title: gif.alt_text || gif.title || 'GIF',
            preview,
            previewType: previewSource?.webp ? 'image/webp' : 'image/gif',
            send,
        };
    }

    // Previews prefer WEBP (GIPHY's recommendation, and far smaller); sends stay GIF so the
    // existing metadata stripper can clean them without flattening the animation.
    private rendition(source: GiphyRendition | undefined, preferWebp: boolean): GifRendition | null {
        const url = (preferWebp && source?.webp) || source?.url;
        const width = Number(source?.width);
        const height = Number(source?.height);
        if (!url || !this.isGiphyMedia(url) || !(width > 0) || !(height > 0)) return null;
        return { url, width, height };
    }

    private isGiphyMedia(url: string): boolean {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:' && parsed.hostname.endsWith(API_URLS.GIPHY.MEDIA_HOST_SUFFIX);
        } catch {
            return false;
        }
    }
}
