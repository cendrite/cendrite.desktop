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
        <div className="media-box">
            {media.map((m) => (
                <MediaItem key={m.id} media={m} />
            ))}
        </div>
    );
};
