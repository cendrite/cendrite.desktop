import { useCallback, useEffect, useRef, useState } from 'react';
import { GifPreview, SearchGifsQuery } from '@/Shared/Gifs/SearchGifs';

// Debounced generously: beta GIPHY keys allow only 100 calls an hour.
const SEARCH_DEBOUNCE_MS = 450;

export type GifSearchError = { code: string | null; message: string };

export function useGifSearch() {
    const [query, setQuery] = useState('');
    const [gifs, setGifs] = useState<GifPreview[]>([]);
    const [nextOffset, setNextOffset] = useState<number | null>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<GifSearchError | null>(null);
    // Each new query bumps the generation so late responses for an older query are dropped.
    const generation = useRef(0);
    const loadingRef = useRef(false);

    const fetchPage = useCallback(async (term: string, offset: number, gen: number) => {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        const result = await window.electron.sendRequestAsync(new SearchGifsQuery(term, offset));
        if (gen !== generation.current) return;

        loadingRef.current = false;
        setLoading(false);
        if (!result.success) {
            setError({ code: result.errorMessage.code, message: result.errorMessage.message });
            return;
        }

        setGifs((prev) => (offset === 0 ? result.data.gifs : [...prev, ...result.data.gifs]));
        setNextOffset(result.data.nextOffset);
    }, []);

    useEffect(() => {
        const gen = ++generation.current;
        setGifs([]);
        setNextOffset(0);

        const term = query.trim();
        // Trending loads immediately; typed searches wait for the user to pause.
        const timer = setTimeout(() => void fetchPage(term, 0, gen), term ? SEARCH_DEBOUNCE_MS : 0);
        return () => clearTimeout(timer);
    }, [query, fetchPage]);

    const loadMore = useCallback(() => {
        if (loadingRef.current || nextOffset === null || nextOffset === 0 || error) return;
        void fetchPage(query.trim(), nextOffset, generation.current);
    }, [nextOffset, error, query, fetchPage]);

    const retry = useCallback(() => {
        void fetchPage(query.trim(), gifs.length === 0 ? 0 : (nextOffset ?? 0), generation.current);
    }, [query, gifs.length, nextOffset, fetchPage]);

    return { query, setQuery, gifs, loading, error, hasMore: nextOffset !== null, loadMore, retry };
}
