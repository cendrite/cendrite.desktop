import { Media } from "../../../Models/Media";

interface MediaBoxProps{
    media: Media[];
}
export const MediaBox: React.FC<MediaBoxProps> = ({media}) => {
    return (
        <div className="media-box">
            {media.map((m, index) => (
                <div key={index} className="media-item">
                    {m.type.startsWith("image/") && <img src={m.url} alt="media" />}
                    {m.type.startsWith("video/") && <video controls src={m.url} />}
                    {m.type.startsWith("audio/") && <audio controls src={m.url} />}
                </div>
            ))}
        </div>
    );
}
