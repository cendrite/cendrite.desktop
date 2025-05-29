import React, {useEffect, useState} from "react";
import {ChatViewModel} from "../../../Models/ChatViewModel.ts";
import ChatHeader from "./ChatHeader.tsx";
import ChatBar from "./ChatBar.tsx";

interface ChatPageProps {
    chat: ChatViewModel;
    onClose: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({chat, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");

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
                    <ChatHeader chat={chat} onClose={()=> handleSlideOut()} />

                    <div className="flex-1 overflow-y-auto p-4 pb-20">
                        {/* CHAT MESSAGE VIEW WILL GO HERE */}
                    </div>

                    <div className="sticky bottom-0 bg-zinc-950">
                        <ChatBar />
                    </div>
                </div>
            </div>
        </>
    );
}

export default ChatPage;