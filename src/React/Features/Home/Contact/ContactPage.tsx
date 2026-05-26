import React, {useEffect, useState} from "react";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import {
    BellSlashIcon,
    ClockIcon,
    NoSymbolIcon,
    PaintBrushIcon,
    PencilIcon,
} from "@heroicons/react/24/outline";
import DeleteFriendModal from "../Modals/DeleteFriendModal.tsx";
import {UserProfileImage} from "../../../Common/Components/ProfilePicture/UserProfileImage.tsx";
import MessageButton from "../../../Common/Components/CommunicationButtons/MessageButton.tsx";
import VoiceCallButton from "../../../Common/Components/CommunicationButtons/VoiceCallButton.tsx";
import VideoCallButton from "../../../Common/Components/CommunicationButtons/VideoCallButton.tsx";
import { Contact } from "../../../Models/Contact.ts";

interface ContactPageProps {
    contact: Contact;
    onClose: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({contact, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        setSlideClass("translate-x-0");
    }, []);

    const handleSlideOut = () => {
        setSlideClass("translate-x-full");
        setTimeout(() => onClose(), 300);
    };


    const handleMute = () => {
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    }

    const handleBlock = () => {
    }

    return (
        <>
            <div className={`absolute inset-0  text-white shadow-lg transition-transform duration-300 ${slideClass}`}>

                <div className="flex flex-col h-full">
                    {/* Top Bar */}
                    <div className="flex items-center p-3 shrink-0">
                        <button
                            className="text-gray-400 hover:text-gray-300"
                            onClick={handleSlideOut}>
                            <ChevronLeftIcon className="w-6 h-6"/>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">

                        {/* Profile Section */}
                        <div className="flex flex-col items-center mt-4">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 mb-3">
                                <UserProfileImage
                                    base64ProfilePicture={contact.avatarKey}
                                    displayName={contact.displayName}
                                    username={contact.username}
                                    profilePictureUrl={null}
                                />
                            </div>
                            <h2 className="text-lg font-semibold">
                                {contact.displayName || contact.username}
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">{contact.id}</p>
                        </div>

                        {/* Button section */}
                        <div className="flex justify-center items-center space-x-4 mt-4">

                            <MessageButton contact={contact}/>
                            <VoiceCallButton contact={contact} withText={true}/>
                            <VideoCallButton withText={true} contact={contact}/>

                            <button
                                className="flex flex-col items-center justify-center hover:bg-darkGray-300 px-3 py-1 rounded-lg"
                                onClick={handleMute}
                            >
                                <BellSlashIcon className="w-5 h-5 mb-0.25 text-gray-200"/>
                                <h3 className="font-extralight text-[0.6rem]">Ignore</h3>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mt-4 mx-auto w-3.5/4 border-t border-zinc-700"/>

                        {/* Settings Section */}
                        <div className="flex items-center mt-6 rounded-md p-3">
                            <ClockIcon className="w-5 h-5 text-gray-300 mr-2"/>
                            <h4 className="text-sm text-gray-200 font-light">
                                Disappearing Messages
                            </h4>

                            <select
                                className="ml-auto text-xs bg-zinc-800 border border-zinc-700 text-gray-200 p-1 roundedfocus:outline-none focus:border-gray-500">
                                <option value="">Off</option>
                                <option value="30">30 Seconds</option>
                                <option value="60">1 Minute</option>
                                <option value="300">5 Minutes</option>
                                <option value="3600">1 Hour</option>
                                <option value="86400">24 Hours</option>
                                <option value="Select">Custom..</option>
                            </select>
                        </div>

                        <div className="flex items-center mt-2 hover:bg-darkGray-800 rounded-md p-4">
                            <PencilIcon className="w-5 h-5 text-gray-300 mr-2"/>
                            <h4 className="text-sm text-gray-200 font-light">
                                Nickname
                            </h4>
                        </div>

                        <div className="flex items-center mt-2 hover:bg-darkGray-800 rounded-md p-4">
                            <PaintBrushIcon className="w-5 h-5 text-gray-300 mr-2"/>
                            <h4 className="text-sm text-gray-200 font-light">
                                Chat Color
                            </h4>
                        </div>

                        {/* Divider */}
                        <div className="mt-4 mx-auto w-3.5/4 border-t border-zinc-700"/>

                        {/* Shared Media Section */}
                        <div className="flex items-center mt-1 rounded-md p-3">
                            <h4 className="text-sm text-gray-200 font-light">
                                Shared Media
                            </h4>
                            <button className="text-sm text-gray-200 font-light ml-auto">
                                Se All
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mt-4 mx-auto w-3.5/4 border-t border-zinc-700"/>

                        {/* Block/Report Section */}
                        <button className="flex items-center mt-2 w-full  hover:bg-darkGray-800 rounded-md p-4"
                                onClick={() => {
                                    handleDelete()
                                }}>
                            <NoSymbolIcon className="w-5 h-5 text-red-600 mr-2"/>
                            <h4 className="text-sm text-red-600 font-light">
                                Delete
                            </h4>
                        </button>
                        <button className="flex items-center mt-2 w-full  hover:bg-darkGray-800 rounded-md p-4"
                                onClick={() => {
                                    handleBlock()
                                }}>
                            <NoSymbolIcon className="w-5 h-5 text-red-600 mr-2"/>
                            <h4 className="text-sm text-red-600 font-light">
                                Block
                            </h4>
                        </button>

                    </div>
                </div>
            </div>
            <DeleteFriendModal contact={contact} isOpen={isDeleteModalOpen} onClose={() => {
                setIsDeleteModalOpen(false)
            }}/>
        </>
    );
};

export default ContactPage;
