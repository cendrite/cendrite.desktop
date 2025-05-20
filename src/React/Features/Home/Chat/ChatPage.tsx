import React, {useEffect, useState} from "react";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import {useChatContext} from "../../../Context/ChatContext.tsx";

interface ChatPageProps {
    chatId: string;
    onClose: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({chatId, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");
    const {chats} = useChatContext();
    const currentChat = chats.find(chat => chat.id === chatId)!;

    useEffect(() => {
        setSlideClass("translate-x-0");
    }, []);

    const handleSlideOut = () => {
        setSlideClass("translate-x-full");
        setTimeout(() => onClose(), 300);
    };

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
                </div>

                <div className="flex flex-col h-full">
                    <div className="flex items-center p-3 shrink-0">
                        <h1 className="text-lg font-bold">{currentChat.contact.displayName || currentChat.contact.username}</h1>
                    </div>
                    {/* Chat messages will go here */}
                </div>
            </div>
        </>
    );
}

export default ChatPage;