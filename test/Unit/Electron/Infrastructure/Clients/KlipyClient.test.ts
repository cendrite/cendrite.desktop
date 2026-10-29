import { describe, expect, test, vi } from 'vitest';
import { KlipyClient } from '../../../../../src/Electron/Infrastructure/Clients/KlipyClient.js';

const file = (name: string) => ({ url: `https://static.klipy.com/ii/x/${name}`, width: 100, height: 75, size: 10 });

const klipyGif = (slug: string) => ({
    id: 1,
    slug,
    title: `title ${slug}`,
    type: 'gif',
    file: {
        md: { gif: file('md.gif'), webp: file('md.webp') },
        sm: { gif: file('sm.gif'), webp: file('sm.webp') },
    },
});

const page = (data: unknown[], hasNext = false) => ({ result: true, data: { data, has_next: hasNext } });

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fakeFetch = (respond: (url: URL) => Response) =>
    vi.fn(async (input: string | URL | Request) => respond(new URL(input.toString()))) as unknown as typeof fetch & {
        mock: { calls: [URL][] };
    };

describe('KlipyClient search', () => {
    test('queries trending when the search is empty', async () => {
        const fetch = fakeFetch(() => json(page([klipyGif('a-1')], true)));
        const sut = new KlipyClient('key123', fetch);

        const result = await sut.search('  ', 0, 24);

        const url = fetch.mock.calls[0][0];
        expect(url.origin + url.pathname).toBe('https://api.klipy.com/api/v1/key123/gifs/trending');
        expect(url.searchParams.get('page')).toBe('1');
        expect(url.searchParams.get('per_page')).toBe('24');
        expect(url.searchParams.get('content_filter')).toBe('medium');
        expect(url.searchParams.has('q')).toBe(false);
        expect(url.searchParams.has('customer_id')).toBe(false);
        expect(result).toEqual({
            success: true,
            data: {
                gifs: [
                    {
                        id: 'a-1',
                        title: 'title a-1',
                        preview: { url: 'https://static.klipy.com/ii/x/sm.webp', width: 100, height: 75 },
                        previewType: 'image/webp',
                        send: { url: 'https://static.klipy.com/ii/x/md.gif', width: 100, height: 75 },
                    },
                ],
                nextOffset: 24,
            },
        });
    });

    test('searches with the trimmed, length-capped query on the matching page', async () => {
        const fetch = fakeFetch(() => json(page([])));
        const sut = new KlipyClient('key123', fetch);

        await sut.search(` ${'x'.repeat(80)} `, 48, 24);

        const url = fetch.mock.calls[0][0];
        expect(url.pathname).toBe('/api/v1/key123/gifs/search');
        expect(url.searchParams.get('q')).toBe('x'.repeat(50));
        expect(url.searchParams.get('page')).toBe('3');
    });

    test.each([
        ['no more results', false, null],
        ['more to come', true, 48],
    ])('reports %s', async (_, hasNext, nextOffset) => {
        const fetch = fakeFetch(() => json(page([], hasNext)));

        const result = await new KlipyClient('k', fetch).search('', 24, 24);

        expect(result.success && result.data.nextOffset).toBe(nextOffset);
    });

    test('falls back to a GIF preview and skips results it cannot display', async () => {
        const noWebp = { ...klipyGif('b'), file: { md: { gif: file('md.gif') }, sm: { gif: file('sm.gif') } } };
        const offsite = {
            ...klipyGif('c'),
            file: { md: { gif: file('md.gif') }, sm: { webp: { ...file('sm.webp'), url: 'https://evil.example/x' } } },
        };
        const noSend = { ...klipyGif('d'), file: { sm: { webp: file('sm.webp') } } };
        const ad = { type: 'ad', content: '<div></div>', width: 300, height: 250 };
        const fetch = fakeFetch(() => json(page([noWebp, offsite, noSend, ad])));

        const result = await new KlipyClient('k', fetch).search('cat', 0, 24);

        expect(result.success && result.data.gifs.map((g) => [g.id, g.previewType])).toEqual([['b', 'image/gif']]);
    });

    test('does not call KLIPY without a key', async () => {
        const fetch = fakeFetch(() => json({}));

        const result = await new KlipyClient('', fetch).search('cat', 0, 24);

        expect(fetch).not.toHaveBeenCalled();
        expect(result.success === false && result.errorMessage.code).toBe('GifsUnavailable');
    });

    test('reports rate limiting separately', async () => {
        const result = await new KlipyClient(
            'k',
            fakeFetch(() => json({}, 429)),
        ).search('cat', 0, 24);

        expect(result.success === false && result.errorMessage.code).toBe('GifsRateLimited');
    });

    test('treats result=false as a failed request', async () => {
        const result = await new KlipyClient(
            'k',
            fakeFetch(() => json({ result: false })),
        ).search('cat', 0, 24);

        expect(result.success === false && result.errorMessage.code).toBe('GifRequestFailed');
    });

    test('turns network failures into a failed result', async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError('fetch failed');
        }) as unknown as typeof globalThis.fetch;

        const result = await new KlipyClient('k', fetch).search('cat', 0, 24);

        expect(result.success === false && result.errorMessage.code).toBe('GifRequestFailed');
    });
});

describe('KlipyClient getById', () => {
    test('fetches a single GIF by slug', async () => {
        const fetch = fakeFetch(() => json(page([klipyGif('hello-hi-662')])));

        const result = await new KlipyClient('k', fetch).getById('hello-hi-662');

        const url = fetch.mock.calls[0][0];
        expect(url.pathname).toBe('/api/v1/k/gifs/items');
        expect(url.searchParams.get('slugs')).toBe('hello-hi-662');
        expect(result.success && result.data.id).toBe('hello-hi-662');
    });

    test('fails when KLIPY returns a different GIF', async () => {
        const fetch = fakeFetch(() => json(page([klipyGif('other')])));

        const result = await new KlipyClient('k', fetch).getById('hello-hi-662');

        expect(result.success).toBe(false);
    });

    test.each(['../../v2/x', 'a,b'])('rejects %s', async (id) => {
        const fetch = fakeFetch(() => json({}));

        const result = await new KlipyClient('k', fetch).getById(id);

        expect(fetch).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
    });
});

describe('KlipyClient download', () => {
    test('downloads KLIPY media', async () => {
        const fetch = fakeFetch(() => new Response(new Uint8Array([1, 2, 3])));

        const result = await new KlipyClient('k', fetch).download('https://static.klipy.com/ii/x/md.gif');

        expect(result).toEqual({ success: true, data: new Uint8Array([1, 2, 3]) });
    });

    test.each([
        'http://static.klipy.com/x.gif',
        'https://klipy.com.evil.example/x.gif',
        'https://evilklipy.com/x.gif',
        'file:///etc/passwd',
        'nope',
    ])('refuses %s', async (url) => {
        const fetch = fakeFetch(() => new Response(''));

        const result = await new KlipyClient('k', fetch).download(url);

        expect(fetch).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
    });

    test('refuses oversized files', async () => {
        const fetch = fakeFetch(() => new Response('', { headers: { 'content-length': String(9 * 1024 * 1024) } }));

        const result = await new KlipyClient('k', fetch).download('https://static.klipy.com/x.gif');

        expect(result.success).toBe(false);
    });
});
