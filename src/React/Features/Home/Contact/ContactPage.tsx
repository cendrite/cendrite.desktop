import React, { useEffect, useState } from "react";
import { Contact } from "../../../Context/ContactContext";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import { UserProfileImage } from "../../../Common/Components/UserProfileImage";
import {
    BellSlashIcon,
    ChatBubbleOvalLeftIcon,
    PhoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";

interface ContactPageProps {
    contact: Contact;
    onClose: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ contact, onClose }) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");

    useEffect(() => {
        // Slide in on mount
        setSlideClass("translate-x-0");
    }, []);

    const handleSlideOut = () => {
        setSlideClass("translate-x-full");
        setTimeout(() => onClose(), 300);
    };

    const handleVideoCall = () => {/* ... */};
    const handleCall = () => {/* ... */};
    const handleMessage = () => {/* ... */};
    const handleMute = () => {/* ... */};

    return (
        <div className={`absolute inset-0  text-white shadow-lg transition-transform duration-300 ${slideClass}`}>
            <div className="flex flex-col h-full">
                {/* Top Bar */}

                <div className="flex items-center p-3 shrink-0">
                    <button
                        className="text-gray-400 hover:text-gray-300"
                        onClick={handleSlideOut}>
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center mt-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 mb-3">
                            <UserProfileImage
                                base64ProfilePicture={contact.profilePicture ?? undefined}
                                displayName={contact.displayName ?? undefined}
                                username={contact.username}
                            />
                        </div>
                        <h2 className="text-lg font-semibold">
                            {contact.displayName || contact.username}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">{contact.id}</p>
                    </div>

                    {/* Button section */}
                    <div className="flex justify-center items-center space-x-4 mt-4">
                        <button
                            className="flex flex-col items-center justify-center hover:bg-darkGray-300 px-1.5 py-1 rounded-lg"
                            onClick={handleMessage}
                        >
                            <ChatBubbleOvalLeftIcon className="w-6 h-6 text-gray-200" />
                            <h3 className="font-extralight text-[0.6rem]">Message</h3>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center hover:bg-darkGray-300 px-4 py-1 rounded-lg"
                            onClick={handleCall}
                        >
                            <PhoneIcon className="w-6 h-6 text-gray-200" />
                            <h3 className="font-extralight text-[0.6rem]">Call</h3>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center hover:bg-darkGray-300 px-1.5 py-1 rounded-lg"
                            onClick={handleVideoCall}
                        >
                            <VideoCameraIcon className="w-6 h-6 text-gray-200" />
                            <h3 className="font-extralight text-[0.6rem]">Video Call</h3>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center hover:bg-darkGray-300 px-3 py-1 rounded-lg"
                            onClick={handleMute}
                        >
                            <BellSlashIcon className="w-6 h-6 mb-0.25 text-gray-200" />
                            <h3 className="font-extralight text-[0.6rem]">Ignore</h3>
                        </button>
                    </div>

                    {/* Divider (shorter than full width) */}
                    <div className="mt-4 mx-auto w-3.5/4 border-t border-zinc-700" />

                    {/* Additional content can go below */}
                    <div className="mt-4 text-sm text-gray-300">
                        {/* Some scrolled content, e.g. contact info, settings, etc. */}
                        Lorem ipsum ...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
