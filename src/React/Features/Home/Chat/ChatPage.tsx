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
import {SignalManager} from "../../../SignalR/SignalManager.ts";
import {ServerChatMessage} from "../../../SignalR/Messaging/ServerChatMessage.ts";
import {MessageHubHandler} from "../../../SignalR/Messaging/MessageHubHandler.ts";

interface ChatPageProps {
    chat: ChatViewModel;
    onClose: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({chat, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");
    const [message, setMessage] = useState<string>("");
    const {user} = useUser();
    const {getChatById, chatDispatch} = useChatContext();
    const currentChat = getChatById(chat.id);
    const messageSender = SignalManager.getInstance().getHandler<MessageHubHandler>("Messaging");


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

        const message: MessageViewModel = {
            id: uuidv4().toString(),
            chatId: chat.id,
            senderId: user!.connectionId,
            text: text,
            date: new Date(),
            deliveryStatus: DeliveryStatus.Sent,
            media: null // Assuming no media for simplicity
        }
        chatDispatch({type: ChatContextActionType.AddMessage, payload: message});

        const content = {
            text: text,
            media: message.media,
        };

        const serializedContent = JSON.stringify(content);

        const messages: ServerChatMessage[] = [];

        for(const connectionId of currentChat.connectionIds) {
            messages.push(new ServerChatMessage(
                message.id,
                chat.id,
                user!.connectionId,
                connectionId,
                serializedContent,
                new Date(),
                uuidv4().toString()));
        }

        const receipt = await messageSender.sendMessage(messages);

        console.log(receipt);
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