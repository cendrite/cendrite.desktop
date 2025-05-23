import React, {useEffect, useState} from "react";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import {ChatViewModel} from "../../../Models/ChatViewModel.ts";

interface ChatPageProps {
    chat: ChatViewModel;
    onClose: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({chat, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");
    console.log(chat);

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
                        {/*<h1 className="text-lg font-bold">{chat.contact.displayName || chat.contact.username}</h1>*/}
                    </div>
                    {/* Chat messages will go here */}
                </div>
            </div>
        </>
    );
}

export default ChatPage;