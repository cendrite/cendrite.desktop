import React, { useEffect, useState } from 'react';
import DeleteFriendModal from '../Modals/DeleteFriendModal.tsx';
import MessageButton from '@/React/Common/Components/CommunicationButtons/MessageButton.tsx';
import VoiceCallButton from '@/React/Common/Components/CommunicationButtons/VoiceCallButton.tsx';
import VideoCallButton from '@/React/Common/Components/CommunicationButtons/VideoCallButton.tsx';
import { Contact } from '@/React/Models/Contact.ts';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import { BellSlashIcon, CaretLeftIcon, ClockIcon, PaintBrushIcon, PencilSimpleIcon, ProhibitIcon } from '@phosphor-icons/react';

interface ContactPageProps {
    contact: Contact;
    onClose: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ contact, onClose }) => {
    const [slideClass, setSlideClass] = useState('translate-x-full');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        setSlideClass('translate-x-0');
    }, []);

    const handleSlideOut = () => {
        setSlideClass('translate-x-full');
        setTimeout(() => onClose(), 300);
    };

    const handleMute = () => { };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleBlock = () => { };

    return (
        <>
            <div className={`absolute inset-0  text-fg shadow-lg transition-transform duration-300 ${slideClass}`}>
                <div className="flex flex-col h-full">
                    {/* Top Bar */}
                    <div className="flex items-center p-3 shrink-0">
                        <button className="text-fg-subtle hover:text-fg-muted" onClick={handleSlideOut}>
                            <CaretLeftIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center mt-4">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-media mb-3">
                                <Avatar
                                    AvatarKey={contact.avatarKey}
                                    Username={contact.username}
                                    className="w-full h-full"
                                />
                            </div>
                            <h2 className="text-lg font-semibold">{contact.displayName || contact.username}</h2>
                            <p className="text-sm text-fg-subtle mt-1">{contact.id}</p>
                        </div>

                        {/* Button section */}
                        <div className="flex justify-center items-center space-x-4 mt-4">
                            <MessageButton contact={contact} />
                            <VoiceCallButton contact={contact} withText={true} />
                            <VideoCallButton withText={true} contact={contact} />

                            <button
                                className="flex flex-col items-center justify-center hover:bg-surface-hover px-3 py-1 rounded-lg"
                                onClick={handleMute}
                            >
                                <BellSlashIcon className="w-5 h-5 mb-0.25 text-fg-muted" />
                                <h3 className="font-extralight text-[0.6rem]">Ignore</h3>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mt-4 mx-auto w-3.5/4 border-t border-line" />

                        {/* Settings Section */}
                        <div className="flex items-center mt-6 rounded-md p-3">
                            <ClockIcon className="w-5 h-5 text-fg-muted mr-2" />
                            <h4 className="text-sm text-fg-muted font-light">Disappearing Messages</h4>

                            <select className="ml-auto text-xs bg-field border border-line text-fg-muted p-1 roundedfocus:outline-none focus:border-line-strong">
                                <option value="">Off</option>
                                <option value="30">30 Seconds</option>
                                <option value="60">1 Minute</option>
                                <option value="300">5 Minutes</option>
                                <option value="3600">1 Hour</option>
                                <option value="86400">24 Hours</option>
                                <option value="Select">Custom..</option>
                            </select>
                        </div>

                        <div className="flex items-center mt-2 hover:bg-canvas-hover rounded-md p-4">
                            <PencilSimpleIcon className="w-5 h-5 text-fg-muted mr-2" />
                            <h4 className="text-sm text-fg-muted font-light">Nickname</h4>
                        </div>

                        <div className="flex items-center mt-2 hover:bg-canvas-hover rounded-md p-4">
                            <PaintBrushIcon className="w-5 h-5 text-fg-muted mr-2" />
                            <h4 className="text-sm text-fg-muted font-light">Chat Color</h4>
                        </div>

                        {/* Divider */}
                        <div className="mt-4 mx-auto w-3.5/4 border-t border-line" />

                        {/* Shared Media Section */}
                        <div className="flex items-center mt-1 rounded-md p-3">
                            <h4 className="text-sm text-fg-muted font-light">Shared Media</h4>
                            <button className="text-sm text-fg-muted font-light ml-auto">Se All</button>
                        </div>

                        {/* Divider */}
                        <div className="mt-4 mx-auto w-3.5/4 border-t border-line" />

                        {/* Block/Report Section */}
                        <button
                            className="flex items-center mt-2 w-full  hover:bg-canvas-hover rounded-md p-4"
                            onClick={() => {
                                handleDelete();
                            }}
                        >
                            <ProhibitIcon className="w-5 h-5 text-danger-fg mr-2" />
                            <h4 className="text-sm text-danger-fg font-light">Delete</h4>
                        </button>
                        <button
                            className="flex items-center mt-2 w-full  hover:bg-canvas-hover rounded-md p-4"
                            onClick={() => {
                                handleBlock();
                            }}
                        >
                            <ProhibitIcon className="w-5 h-5 text-danger-fg mr-2" />
                            <h4 className="text-sm text-danger-fg font-light">Block</h4>
                        </button>
                    </div>
                </div>
            </div>
            <DeleteFriendModal
                contact={contact}
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                }}
            />
        </>
    );
};

export default ContactPage;
