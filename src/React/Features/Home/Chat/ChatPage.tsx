import React, {useEffect, useState} from "react";
import {ChatViewModel} from "../../../Models/ChatViewModel.ts";
import ChatHeader from "./ChatHeader.tsx";
import ChatBar from "./ChatBar.tsx";
import {useChatContext} from "../../../Context/Chat/ChatContext.tsx";
import MessageList from "./MessageList.tsx";
import {useMessageService} from "../../../Common/Services/MessageService.ts";

interface ChatPageProps {
    chat: ChatViewModel;
    onClose: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({chat, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");
    const [message, setMessage] = useState<string>("");
    const {getChatById} = useChatContext();
    const currentChat = getChatById(chat.id);
    const {sendMessage, markMessagesAsRead} = useMessageService();


    useEffect(()=> {
        markMessagesAsRead(currentChat).then(_ => _);
    }, [currentChat, markMessagesAsRead])

    useEffect(() => {
        setSlideClass("translate-x-0");
    }, []);

    const handleSlide = () => {
        setSlideClass("translate-x-full");
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const onSendMessage = async (text: string): Promise<void> => {
        if (!text.trim()) return;
        await sendMessage(currentChat, text, null);
    }

    return (
        <>
            <div className={`absolute inset-0  text-white shadow-lg transition-transform duration-300 ${slideClass}`}>
                <div className="flex flex-col h-full">
                    <ChatHeader chat={chat} onClose={() => handleSlide()}/>

                    <MessageList messages={currentChat.messages}/>

                    <div className="sticky bottom-0 bg-zinc-950">
                        <ChatBar
                            sendMessage={onSendMessage}
                            message={message}
                            setMessage={setMessage}/>

                    </div>
                </div>
            </div>
        </>
    );
}

export default ChatPage;