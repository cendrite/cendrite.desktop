import React from 'react';
import ChevronLeftIcon from '@heroicons/react/24/outline/ChevronLeftIcon';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';
import VoiceCallButton from '../../../Common/Components/CommunicationButtons/VoiceCallButton.tsx';
import VideoCallButton from '../../../Common/Components/CommunicationButtons/VideoCallButton.tsx';
import ChatSettingsMenu from './ChatSettingsMenu.tsx';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';

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
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-media ml-3">
                    <Avatar
                        className="w-11 h-11"
                        AvatarKey={chatMember?.contact.avatarKey}
                        Username={chatMember?.contact.username ?? "?"}
                    />
                </div>

                <span className="text-fg text-sm ml-3">
                    {chatMember.displayName || chatMember.contact.displayName}
                </span>
            </div>

            <div className="flex items-center space-x-2">
                <VoiceCallButton contact={chatMember.contact} />
                <VideoCallButton contact={chatMember.contact} />
                <ChatSettingsMenu chat={chat} />
            </div>
        </div>
    );
};

export default ChatHeader;
