import React from 'react';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';
import VoiceCallButton from '../../../Common/Components/CommunicationButtons/VoiceCallButton.tsx';
import VideoCallButton from '../../../Common/Components/CommunicationButtons/VideoCallButton.tsx';
import ChatSettingsMenu from './ChatSettingsMenu.tsx';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';
import CreateGroupButton from './CreateGroupButton.tsx';
import { CaretLeftIcon } from '@phosphor-icons/react';

interface ChatHeaderProps {
    chat: ChatViewModel;
    onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat, onClose }) => {
    const chatMember = chat.chatMembers[0];

    return (
        <div className="flex items-center justify-between p-3 w-full">
            <div className="flex items-center">
                <button className="text-fg-subtle hover:text-fg-muted" onClick={onClose}>
                    <CaretLeftIcon className="w-6 h-6" />
                </button>

                <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-media ml-3">
                    <Avatar
                        className="w-11 h-11"
                        AvatarKey={chatMember?.contact?.avatarKey ?? null}
                        Username={chatMember?.name ?? "?"}
                    />
                </div>

                <span className="text-fg text-sm ml-3">
                    {chatMember.name}
                </span>
            </div>

            <div className="flex items-center space-x-2">
                {chatMember.contact && (
                    <>
                        <VoiceCallButton contact={chatMember.contact} />
                        <VideoCallButton contact={chatMember.contact} />
                        <CreateGroupButton contact={chatMember.contact} />
                    </>
                )}
                <ChatSettingsMenu chat={chat} />
            </div>
        </div>
    );
};

export default ChatHeader;
