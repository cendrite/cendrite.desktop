import React, { useEffect, useState } from 'react';
import { GifErrorCode, GifPreview } from '@/Shared/Gifs/SearchGifs';
import { useGifSearch } from '@/React/Common/Hooks/GifSearch';

// Start loading the next page while there is still roughly a screen of GIFs left to scroll.
const LOAD_MORE_THRESHOLD_PX = 300;

const GifTile: React.FC<{ gif: GifPreview; busy: boolean; disabled: boolean; onSelect: () => void }> = ({
    gif,
    busy,
    disabled,
    onSelect,
}) => {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        const objectUrl = URL.createObjectURL(
            new Blob([gif.preview as Uint8Array<ArrayBuffer>], { type: gif.previewType }),
        );
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [gif]);

    return (
        <button
            type="button"
            title={gif.title}
            aria-label={gif.title}
            disabled={disabled}
            onClick={onSelect}
            className="relative mb-1.5 block w-full overflow-hidden rounded-md bg-field break-inside-avoid
                hover:ring-2 hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait"
            style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
        >
            {url && <img src={url} alt="" className="h-full w-full object-cover" />}
            {busy && (
                <span className="absolute inset-0 flex items-center justify-center bg-scrim/50 text-xs text-fg">
                    Sending…
                </span>
            )}
        </button>
    );
};

function describeError(code: string | null): string {
    switch (code) {
        case GifErrorCode.Unavailable:
            return 'GIF search isn’t set up in this build';
        case GifErrorCode.RateLimited:
            return 'Too many GIF searches. Try again in a little while';
        default:
            return 'Couldn’t load GIFs';
    }
}

export interface GifPickerProps {
    // Resolves to false when the GIF couldn't be sent, so the picker can say so.
    onGifSelect: (gif: GifPreview) => Promise<boolean>;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onGifSelect }) => {
    const { query, setQuery, gifs, loading, error, hasMore, loadMore, retry } = useGifSearch();
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [sendFailed, setSendFailed] = useState(false);

    const select = async (gif: GifPreview) => {
        setSendingId(gif.id);
        setSendFailed(false);
        const sent = await onGifSelect(gif);
        setSendingId(null);
        setSendFailed(!sent);
    };

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_THRESHOLD_PX) loadMore();
    };

    const canRetry = error && error.code !== GifErrorCode.Unavailable;

    return (
        <div className="flex h-[420px] w-[316px] flex-col bg-overlay">
            <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={50}
                placeholder="Search GIPHY"
                aria-label="Search GIFs"
                className="mx-2 mt-2 appearance-none rounded-md bg-field px-2.5 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none"
            />

            <div className="relative flex-1 overflow-y-auto px-2 pt-2" onScroll={onScroll}>
                {!query.trim() && gifs.length > 0 && (
                    <div className="pb-1.5 text-xs font-medium text-fg-subtle">Trending</div>
                )}

                <div className="columns-2 gap-1.5">
                    {gifs.map((gif) => (
                        <GifTile
                            key={gif.id}
                            gif={gif}
                            busy={sendingId === gif.id}
                            disabled={sendingId !== null}
                            onSelect={() => void select(gif)}
                        />
                    ))}
                </div>

                {loading && <p className="py-4 text-center text-sm text-fg-faint">Loading…</p>}

                {!loading && !error && gifs.length === 0 && query.trim() && (
                    <p className="py-4 text-center text-sm text-fg-faint">No GIFs found</p>
                )}

                {!loading && !error && gifs.length > 0 && !hasMore && (
                    <p className="py-3 text-center text-xs text-fg-faint">That’s all of them</p>
                )}

                {error && (
                    <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-fg-faint">
                        <p>{describeError(error.code)}</p>
                        {canRetry && (
                            <button
                                type="button"
                                onClick={retry}
                                className="rounded-md px-3 py-1 text-fg-muted hover:bg-surface-hover"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex h-9 flex-none items-center justify-between border-t border-line px-3 text-xs">
                {sendFailed ? (
                    <span className="text-danger-fg">Couldn’t send that GIF</span>
                ) : (
                    <span className="text-fg-faint">Searches go to GIPHY</span>
                )}
                <span className="font-semibold tracking-wide text-fg-muted">Powered by GIPHY</span>
            </div>
        </div>
    );
};

export default GifPicker;
