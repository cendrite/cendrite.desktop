import React, { useEffect, useState } from "react";
import { Media } from "@/React/Models/Media";
import { MediaCarousel } from "./MediaCarousel";

interface MediaBoxProps {
    media: Media[];
}

const MAX_FANNED = 3;

// Indexed like the media: the first item lies on top, the rest fan out behind it.
const FAN_LAYOUT: Record<number, { rotate: number; shift: number }[]> = {
    2: [
        { rotate: -4, shift: -10 },
        { rotate: 8, shift: 16 },
    ],
    3: [
        { rotate: 0, shift: 0 },
        { rotate: -10, shift: -28 },
        { rotate: 10, shift: 28 },
    ],
};

export const MediaItem: React.FC<{ media: Media; className?: string }> = ({ media, className }) => {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        const objectUrl = URL.createObjectURL(media.getBlob());
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [media]);

    if (media.content.length === 0) {
        return <p className="text-xs italic opacity-70">Media no longer available</p>;
    }

    if (!url) return null;

    if (media.type.startsWith("image/")) return <img src={url} alt="media" className={className} />;
    if (media.type.startsWith("video/")) return <video controls src={url} className={className} />;
    if (media.type.startsWith("audio/")) return <audio controls src={url} className={className} />;
    return null;
};

const MediaFan: React.FC<{ media: Media[] }> = ({ media }) => {
    const fanned = media.slice(0, MAX_FANNED);
    const layout = FAN_LAYOUT[fanned.length];
    const hidden = media.length - fanned.length;

    return (
        // Sized to hold the fully spread fan, so hovering never pushes a card past the edge and scrolls the chat.
        <div className="group relative h-[268px] w-[336px]">
            {fanned.map((m, i) => (
                <div
                    key={m.id}
                    className="absolute inset-0 m-auto h-56 w-44 origin-bottom overflow-hidden rounded-2xl bg-surface
                        ring-2 ring-canvas transition-transform duration-500 ease-out
                        [transform:translateX(var(--shift))_rotate(var(--rotate))]
                        group-hover:[transform:translateX(calc(var(--shift)*1.2))_rotate(calc(var(--rotate)*1.2))]"
                    style={
                        {
                            "--shift": `${layout[i].shift}px`,
                            "--rotate": `${layout[i].rotate}deg`,
                            zIndex: fanned.length - i,
                        } as React.CSSProperties
                    }
                >
                    <MediaItem media={m} className="pointer-events-none h-full w-full object-cover" />
                    {i === 0 && hidden > 0 && (
                        <span className="absolute right-2 bottom-2 rounded-full bg-scrim/70 px-2 py-0.5 text-xs font-medium text-fg">
                            +{hidden}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

export const MediaBox: React.FC<MediaBoxProps> = ({ media }) => {
    const [carouselOpen, setCarouselOpen] = useState(false);

    if (media.length === 0) return null;

    const single = media.length === 1;
    // Players need their own controls, so a lone video or audio clip is not opened in the carousel.
    if (single && !media[0].type.startsWith("image/")) {
        return <MediaItem media={media[0]} className="max-h-72 max-w-80 rounded-2xl" />;
    }

    return (
        <>
            <div
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    setCarouselOpen(true);
                }}
            >
                {single ? (
                    <MediaItem media={media[0]} className="max-h-72 max-w-80 rounded-2xl" />
                ) : (
                    <MediaFan media={media} />
                )}
            </div>
            <MediaCarousel
                media={media}
                startIndex={0}
                isOpen={carouselOpen}
                onClose={() => setCarouselOpen(false)}
            />
        </>
    );
};
