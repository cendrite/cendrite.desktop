import React, {useEffect, useState} from "react";
import {ChatViewModel} from "../../../Models/ChatViewModel.ts";
import ChatHeader from "./ChatHeader.tsx";
import ChatBar from "./ChatBar.tsx";
import {useChatContext} from "../../../Context/Chat/ChatContext.tsx";
import {useUser} from "../../../Context/UserContext.tsx";
import {MessageViewModel} from "../../../Models/MessageViewModel.ts";
import {v4 as uuidv4} from 'uuid';
import {ChatContextActionType} from "../../../Context/Chat/ChatReducer.ts";
import {DeliveryStatus} from "../../../../Electron/Domain/Enums/DeliveryStatus.ts";
import MessageList from "./MessageList.tsx";

interface ChatPageProps {
    chat: ChatViewModel;
    onClose: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({chat, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");
    const [message, setMessage] = useState<string>("");
    const {user} = useUser();
    const {getChatById, dispatch} = useChatContext();
    const currentChat = getChatById(chat.id);


    useEffect(() => {
        setSlideClass("translate-x-0");
    }, []);

    const handleSlide = () => {
        setSlideClass("translate-x-full");
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const onSendMessage = async (message: string): Promise<void> => {
        if(!message.trim()) return;

        const newMessage: MessageViewModel = {
            id: uuidv4(),
            chatId: chat.id,
            senderId: user!.id,
            text: message,
            date: new Date(),
            deliveryStatus: DeliveryStatus.Sent,
            media: null // Assuming no media for simplicity
        }
        dispatch({type: ChatContextActionType.AddMessage, payload: newMessage});
    }

    return (
        <>
            <div className={`absolute inset-0  text-white shadow-lg transition-transform duration-300 ${slideClass}`}>
                <div className="flex flex-col h-full">
                    <ChatHeader chat={chat} onClose={()=> handleSlide()} />


                    <MessageList messages={currentChat.messages} />

                    <div className="sticky bottom-0 bg-zinc-950">
                        <ChatBar
                            sendMessage={onSendMessage}
                            message={message}
                            setMessage={setMessage} />

                    </div>
                </div>
            </div>
        </>
    );
}

export default ChatPage;