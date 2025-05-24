import {ChatViewModel} from "../../../Models/ChatViewModel.ts";
import React from "react";
import {EllipsisHorizontalIcon} from "@heroicons/react/24/solid";

interface ChatSettingsButtonProps {
    chat: ChatViewModel
}

const ChatSettingsButton: React.FunctionComponent<ChatSettingsButtonProps> = ({chat}) => {
    const handleSettings = () => {
        console.log("Settings clicked for chat:", chat.id);
    };

    return (
        <button
            onClick={handleSettings}
            className="flex items-center justify-center hover:bg-darkGray-300 rounded-lg p-2"
        >
            <EllipsisHorizontalIcon className="w-5 h-5 text-gray-200"/>
        </button>
    );
}

export default ChatSettingsButton;