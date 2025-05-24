import React from "react";
import {useHomePageContext} from "../../../Context/HomePageContext.tsx";
import { ChatService } from "../../Services/ChatService.ts";
import {Contact} from "../../../Context/ContactContext.tsx";
import {useChatContext} from "../../../Context/Chat/ChatContext.tsx";
import { ChatContextActionType } from "../../../Context/Chat/ChatReducer.ts";
import { ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline";


interface MessageButtonProps{
    contact: Contact;
    handleSlideOut:()=> void;
}

const MessageButton: React.FC<MessageButtonProps> = ({contact, handleSlideOut}) => {
    const {setSelectedChat} = useHomePageContext();
    const {getChatByMemberId, dispatch} = useChatContext();
    const chatService = new ChatService();

    const handleMessage = async () => {
        const chat = getChatByMemberId(contact.id);
        if (chat) {
            setSelectedChat(chat);
            handleSlideOut();
        } else {
            const chat = await chatService.createChat(contact);
            dispatch({type: ChatContextActionType.AddChat, payload: chat});
            setSelectedChat(chat);
        }
    };

    return (
        <button
            className="flex flex-col items-center justify-center hover:bg-darkGray-300 px-1.5 py-1 rounded-lg"
            onClick={handleMessage}
        >
            <ChatBubbleOvalLeftIcon className="w-5 h-5 text-gray-200"/>
            <h3 className="font-extralight text-[0.6rem]">Message</h3>
        </button>
    );
}

export default MessageButton;