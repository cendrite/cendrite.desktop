import React, {useEffect, useState} from "react";
import {ChatViewModel} from "../../../Models/ChatViewModel.ts";
import ChatHeader from "./ChatHeader.tsx";

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
                <ChatHeader chat={chat} onClose={()=> handleSlideOut()} />
            </div>
        </>
    );
}

export default ChatPage;