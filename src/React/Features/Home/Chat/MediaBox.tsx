import { useEffect, useState } from "react";
import { Media } from "@/React/Models/Media";

interface MediaBoxProps {
    media: Media[];
}

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

export const MediaBox: React.FC<MediaBoxProps> = ({ media }) => {
    return (
        // TODO: on click, open a modal to scroll through the images
        <div className="grid cursor-pointer">
            {media.map((m, i) => (
                <div
                    key={m.id}
                    className="rounded-lg overflow-hidden shadow"
                    style={{ gridArea: '1 / 1', transform: `translate(${i * 5}px, ${i * 5}px)`, zIndex: i }}
                >
                    <MediaItem media={m} className="max-h-60 rounded-lg" />
                </div>
            ))}
        </div>
    );
};
