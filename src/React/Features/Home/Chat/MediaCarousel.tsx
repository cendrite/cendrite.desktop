import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { CaretLeftIcon, CaretRightIcon, XIcon } from '@phosphor-icons/react';
import { Media } from '@/React/Models/Media';
import { MediaItem } from './MediaBox';

interface MediaCarouselProps {
    media: Media[];
    startIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, startIndex, isOpen, onClose }) => {
    const [index, setIndex] = useState(startIndex);
    const hasMany = media.length > 1;

    useEffect(() => {
        if (isOpen) setIndex(startIndex);
    }, [isOpen, startIndex]);

    const step = (delta: number) => setIndex((i) => (i + delta + media.length) % media.length);

    const current = media[index];
    if (!current) return null;

    return (
        // The dialog is portalled, but React events still bubble to the message underneath.
        <Dialog open={isOpen} onClose={onClose} onClick={(e) => e.stopPropagation()} className="relative z-[1010]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/90" />

            {/* The panel fills the screen so the controls count as inside it; only the empty
                area around the image closes the carousel. */}
            <DialogPanel
                className="fixed inset-0 flex items-center justify-center p-12"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
                onKeyDown={(e) => {
                    if (!hasMany) return;
                    if (e.key === 'ArrowLeft') step(-1);
                    if (e.key === 'ArrowRight') step(1);
                }}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 rounded-full p-2 text-fg-muted hover:bg-surface-hover hover:text-fg"
                >
                    <XIcon className="h-5 w-5" />
                </button>

                {hasMany && (
                    <span className="absolute top-5 left-1/2 -translate-x-1/2 text-sm text-fg-muted">
                        {index + 1} / {media.length}
                    </span>
                )}

                {hasMany && (
                    <button
                        onClick={() => step(-1)}
                        aria-label="Previous"
                        className="absolute left-4 rounded-full bg-surface/80 p-2 text-fg-muted hover:bg-surface-hover hover:text-fg"
                    >
                        <CaretLeftIcon className="h-5 w-5" />
                    </button>
                )}

                <MediaItem
                    key={current.id}
                    media={current}
                    className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain"
                />

                {hasMany && (
                    <button
                        onClick={() => step(1)}
                        aria-label="Next"
                        className="absolute right-4 rounded-full bg-surface/80 p-2 text-fg-muted hover:bg-surface-hover hover:text-fg"
                    >
                        <CaretRightIcon className="h-5 w-5" />
                    </button>
                )}
            </DialogPanel>
        </Dialog>
    );
};

export default MediaCarousel;
