import React from "react";
import { Contact } from "../../../Models/Contact";
import { VideoCameraIcon } from "@phosphor-icons/react";

interface VideoCallButtonProps {
    withText?: boolean;
    contact: Contact;
    className?: string;
}

const VideoCallButton: React.FC<VideoCallButtonProps> = ({withText, contact, className = ""}) => {
    const handleVideoCall = () => {
        console.log(contact)
    };

    return (
        <button
            onClick={handleVideoCall}
            className={[
                "flex items-center justify-center hover:bg-surface-hover rounded-lg",
                withText ? "flex-col px-1.5 py-1" : "p-2",
                className,
            ].join(" ")}
        >
            <VideoCameraIcon className="w-5 h-5 text-fg-muted" />
            {withText && (
                <span className="font-extralight text-[0.6rem] leading-none mt-0.5">
          Video&nbsp;Call
        </span>
            )}
        </button>
    );
};

export default VideoCallButton;
