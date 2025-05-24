import React from "react";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import {UserProfileImage} from "../../../Common/Components/UserProfileImage.tsx";
import VoiceCallButton from "../../../Common/Components/VoiceCallButton.tsx";
import VideoCallButton from "../../../Common/Components/VideoCallButton.tsx";
import ChatSettingsButton from "./ChatSettingsButton.tsx";
import {ChatViewModel} from "../../../Models/ChatViewModel.ts";


interface ChatHeaderProps {
    chat: ChatViewModel;
    onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({chat, onClose}) => {
    const chatMember = chat.chatMembers[0];
    return (
        <div className="flex items-center justify-between p-3 w-full">
            <div className="flex items-center">
                <button
                    className="text-gray-400 hover:text-gray-300"
                    onClick={onClose}>
                    <ChevronLeftIcon className="w-6 h-6"/>
                </button>

                <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 ml-3">
                    <UserProfileImage
                        base64ProfilePicture={chatMember.contact.profilePicture}
                        displayName={chatMember.displayName || chatMember.contact.displayName}
                        username={chatMember.contact.username}
                    />
                </div>

                <span
                    className="text-white text-sm ml-3">{chatMember.displayName || chatMember.contact.displayName}</span>
            </div>

            {/* RIGHT group */}
            <div className="flex items-center space-x-2">
                <VoiceCallButton contact={chatMember.contact}/>
                <VideoCallButton contact={chatMember.contact}/>
                <ChatSettingsButton chat={chat}/>
            </div>
        </div>
    );
}

export default ChatHeader;