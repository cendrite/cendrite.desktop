import { useEffect, useState } from "react";
import { Media } from "../../../Models/Media";

interface MediaBoxProps {
    media: Media[];
}

export const MediaItem: React.FC<{ media: Media }> = ({ media }) => {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        const objectUrl = URL.createObjectURL(media.getBlob());
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [media]);

    if (!url) return null;

    return (
        <div className="media-item">
            {media.type.startsWith("image/") && <img src={url} alt="media" />}
            {media.type.startsWith("video/") && <video controls src={url} />}
            {media.type.startsWith("audio/") && <audio controls src={url} />}
        </div>
    );
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
                    <MediaItem media={m} />
                </div>
            ))}
        </div>
    );
};
