import React from "react";
import { VideoCameraIcon } from "@heroicons/react/24/outline";
import { Contact } from "../../../Models/Contact";

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
                "flex items-center justify-center hover:bg-darkGray-300 rounded-lg",
                withText ? "flex-col px-1.5 py-1" : "p-2",
                className,
            ].join(" ")}
        >
            <VideoCameraIcon className="w-5 h-5 text-gray-200" />
            {withText && (
                <span className="font-extralight text-[0.6rem] leading-none mt-0.5">
          Video&nbsp;Call
        </span>
            )}
        </button>
    );
};

export default VideoCallButton;
