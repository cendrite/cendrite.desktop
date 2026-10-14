import React from "react";
import { Contact } from "@/React/Models/Contact";
import { PhoneIcon } from "@phosphor-icons/react";

interface VoiceCallButtonProps {
    contact: Contact;
    withText?: boolean;
    className?: string;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({contact, withText, className = ""}) => {
    const handleVoiceCall = () => {
        console.log("Voice call to contact:", contact);
    };

    return (
        <button
            onClick={handleVoiceCall}
            className={["flex items-center justify-center hover:bg-surface-hover rounded-lg",
                withText ? "flex-col px-2.5 py-1" : "p-2", className].join(" ")}
        >
            <PhoneIcon className="w-5 h-5 text-fg-muted"/>
            {withText && (
                <span className="font-extralight text-[0.6rem] leading-none mt-0.5">
          Call
        </span>
            )}
        </button>
    );
};

export default VoiceCallButton;
