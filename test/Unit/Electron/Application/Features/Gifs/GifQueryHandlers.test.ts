import { describe, expect, test, vi } from 'vitest';
import { Result } from '../../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../../src/Shared/Result/ErrorMessage.js';
import { SearchGifsQuery } from '../../../../../../src/Shared/Gifs/SearchGifs.js';
import { GetGifQuery } from '../../../../../../src/Shared/Gifs/GetGif.js';
import { SearchGifsQueryHandler } from '../../../../../../src/Electron/Application/Features/Gifs/Queries/SearchGifsQueryHandler.js';
import { GetGifQueryHandler } from '../../../../../../src/Electron/Application/Features/Gifs/Queries/GetGifQueryHandler.js';
import type {
    GifResult,
    IGifProvider,
} from '../../../../../../src/Electron/Application/Contracts/Providers/IGifProvider.js';

const gif = (id: string): GifResult => ({
    id,
    title: `GIF ${id}`,
    preview: { url: `https://media.giphy.com/${id}/100w.webp`, width: 100, height: 80 },
    previewType: 'image/webp',
    send: { url: `https://media.giphy.com/${id}/downsized.gif`, width: 200, height: 160 },
});

const provider = (overrides: Partial<IGifProvider> = {}): IGifProvider => ({
    isConfigured: () => true,
    search: vi.fn(async () => Result.success({ gifs: [gif('a'), gif('b')], nextOffset: 24 })),
    getById: vi.fn(async (id: string) => Result.success(gif(id))),
    download: vi.fn(async (url: string) =>
        url.includes('/b/')
            ? Result.fail(new ErrorMessage('GifDownloadFailed', 'x'))
            : Result.success(new Uint8Array([7])),
    ),
    ...overrides,
});

describe('searching GIFs', () => {
    test('returns previews with their bytes and skips ones that failed to download', async () => {
        const gifs = provider();

        const result = await new SearchGifsQueryHandler(gifs).handle(new SearchGifsQuery('cat', 24));

        expect(gifs.search).toHaveBeenCalledWith('cat', 24, 24);
        expect(result).toEqual({
            success: true,
            data: {
                gifs: [
                    {
                        id: 'a',
                        title: 'GIF a',
                        width: 100,
                        height: 80,
                        previewType: 'image/webp',
                        preview: new Uint8Array([7]),
                    },
                ],
                nextOffset: 24,
            },
        });
    });

    test('passes search failures through', async () => {
        const failure = Result.fail(new ErrorMessage('GifsRateLimited', 'slow down'));
        const gifs = provider({ search: async () => failure });

        expect(await new SearchGifsQueryHandler(gifs).handle(new SearchGifsQuery('cat', 0))).toBe(failure);
    });
});

describe('getting a GIF to send', () => {
    test('re-fetches it by id and strips it as a GIF', async () => {
        const gifs = provider();
        const stripper = { strip: vi.fn(() => Buffer.from([9, 9])) };

        const result = await new GetGifQueryHandler(gifs, stripper).handle(new GetGifQuery('a'));

        expect(gifs.download).toHaveBeenCalledWith('https://media.giphy.com/a/downsized.gif');
        expect(stripper.strip).toHaveBeenCalledWith(Buffer.from([7]), 'image/gif');
        expect(result.success && result.data.type).toBe('image/gif');
        expect(result.success && Buffer.from(result.data.content)).toEqual(Buffer.from([9, 9]));
    });

    test('fails when the GIF cannot be cleaned', async () => {
        const stripper = {
            strip: () => {
                throw new Error('Failed to decode image');
            },
        };

        const result = await new GetGifQueryHandler(provider(), stripper).handle(new GetGifQuery('a'));

        expect(result.success).toBe(false);
    });

    test('fails when the download fails', async () => {
        const stripper = { strip: vi.fn() };

        const result = await new GetGifQueryHandler(provider(), stripper).handle(new GetGifQuery('b'));

        expect(result.success).toBe(false);
        expect(stripper.strip).not.toHaveBeenCalled();
    });
});
