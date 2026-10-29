import { describe, expect, test, vi } from 'vitest';
import { GiphyClient } from '../../../../../src/Electron/Infrastructure/Clients/GiphyClient.js';

const rendition = (name: string, webp = true) => ({
    url: `https://media1.giphy.com/media/x/${name}.gif`,
    ...(webp ? { webp: `https://media1.giphy.com/media/x/${name}.webp` } : {}),
    width: '100',
    height: '75',
});

const giphyGif = (id: string) => ({
    id,
    title: `title ${id}`,
    alt_text: '',
    images: { fixed_width_small: rendition('100w'), downsized: rendition('giphy-downsized', false) },
});

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fakeFetch = (respond: (url: URL) => Response) =>
    vi.fn(async (input: string | URL | Request) => respond(new URL(input.toString()))) as unknown as typeof fetch & {
        mock: { calls: [URL][] };
    };

describe('GiphyClient search', () => {
    test('queries trending when the search is empty', async () => {
        const fetch = fakeFetch(() =>
            json({ data: [giphyGif('a')], pagination: { offset: 0, count: 1, total_count: 10 } }),
        );
        const sut = new GiphyClient('key123', fetch);

        const result = await sut.search('  ', 0, 24);

        const url = fetch.mock.calls[0][0];
        expect(url.origin + url.pathname).toBe('https://api.giphy.com/v1/gifs/trending');
        expect(url.searchParams.get('api_key')).toBe('key123');
        expect(url.searchParams.get('rating')).toBe('pg-13');
        expect(url.searchParams.has('q')).toBe(false);
        expect(result).toEqual({
            success: true,
            data: {
                gifs: [
                    {
                        id: 'a',
                        title: 'title a',
                        preview: { url: 'https://media1.giphy.com/media/x/100w.webp', width: 100, height: 75 },
                        previewType: 'image/webp',
                        send: { url: 'https://media1.giphy.com/media/x/giphy-downsized.gif', width: 100, height: 75 },
                    },
                ],
                nextOffset: 1,
            },
        });
    });

    test('searches with the trimmed, length-capped query', async () => {
        const fetch = fakeFetch(() => json({ data: [], pagination: { offset: 0, count: 0, total_count: 0 } }));
        const sut = new GiphyClient('key123', fetch);

        await sut.search(` ${'x'.repeat(80)} `, 48, 24);

        const url = fetch.mock.calls[0][0];
        expect(url.pathname).toBe('/v1/gifs/search');
        expect(url.searchParams.get('q')).toBe('x'.repeat(50));
        expect(url.searchParams.get('offset')).toBe('48');
        expect(url.searchParams.get('limit')).toBe('24');
    });

    test.each([
        ['no more results', { offset: 0, count: 2, total_count: 2 }, null],
        ['an empty page', { offset: 24, count: 0 }, null],
        ['more to come', { offset: 24, count: 24, total_count: 100 }, 48],
        ['trending past its offset cap', { offset: 480, count: 24 }, null],
    ])('reports %s', async (_, pagination, nextOffset) => {
        const fetch = fakeFetch(() => json({ data: [], pagination }));

        const result = await new GiphyClient('k', fetch).search('', 0, 24);

        expect(result.success && result.data.nextOffset).toBe(nextOffset);
    });

    test('falls back to a GIF preview and skips results it cannot display', async () => {
        const noWebp = {
            ...giphyGif('b'),
            images: { fixed_width_small: rendition('100w', false), downsized: rendition('d') },
        };
        const offsite = {
            ...giphyGif('c'),
            images: {
                fixed_width_small: { ...rendition('100w'), webp: 'https://evil.example/x.webp' },
                downsized: rendition('d'),
            },
        };
        const noSend = { ...giphyGif('d'), images: { fixed_width_small: rendition('100w') } };
        const fetch = fakeFetch(() => json({ data: [noWebp, offsite, noSend], pagination: { offset: 0, count: 3 } }));

        const result = await new GiphyClient('k', fetch).search('cat', 0, 24);

        expect(result.success && result.data.gifs.map((g) => [g.id, g.previewType])).toEqual([['b', 'image/gif']]);
    });

    test('does not call GIPHY without a key', async () => {
        const fetch = fakeFetch(() => json({}));

        const result = await new GiphyClient('', fetch).search('cat', 0, 24);

        expect(fetch).not.toHaveBeenCalled();
        expect(result.success === false && result.errorMessage.code).toBe('GifsUnavailable');
    });

    test('reports rate limiting separately', async () => {
        const result = await new GiphyClient(
            'k',
            fakeFetch(() => json({}, 429)),
        ).search('cat', 0, 24);

        expect(result.success === false && result.errorMessage.code).toBe('GifsRateLimited');
    });

    test('turns network failures into a failed result', async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError('fetch failed');
        }) as unknown as typeof globalThis.fetch;

        const result = await new GiphyClient('k', fetch).search('cat', 0, 24);

        expect(result.success === false && result.errorMessage.code).toBe('GifRequestFailed');
    });
});

describe('GiphyClient getById', () => {
    test('fetches a single GIF', async () => {
        const fetch = fakeFetch(() => json({ data: giphyGif('abc123') }));

        const result = await new GiphyClient('k', fetch).getById('abc123');

        expect(fetch.mock.calls[0][0].pathname).toBe('/v1/gifs/abc123');
        expect(result.success && result.data.id).toBe('abc123');
    });

    test('rejects ids that could change the request path', async () => {
        const fetch = fakeFetch(() => json({}));

        const result = await new GiphyClient('k', fetch).getById('../../v2/x');

        expect(fetch).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
    });
});

describe('GiphyClient download', () => {
    test('downloads GIPHY media', async () => {
        const fetch = fakeFetch(() => new Response(new Uint8Array([1, 2, 3])));

        const result = await new GiphyClient('k', fetch).download('https://media2.giphy.com/media/x/200.gif');

        expect(result).toEqual({ success: true, data: new Uint8Array([1, 2, 3]) });
    });

    test.each(['http://media.giphy.com/x.gif', 'https://giphy.com.evil.example/x.gif', 'file:///etc/passwd', 'nope'])(
        'refuses %s',
        async (url) => {
            const fetch = fakeFetch(() => new Response(''));

            const result = await new GiphyClient('k', fetch).download(url);

            expect(fetch).not.toHaveBeenCalled();
            expect(result.success).toBe(false);
        },
    );

    test('refuses oversized files', async () => {
        const fetch = fakeFetch(() => new Response('', { headers: { 'content-length': String(9 * 1024 * 1024) } }));

        const result = await new GiphyClient('k', fetch).download('https://media.giphy.com/x.gif');

        expect(result.success).toBe(false);
    });
});
