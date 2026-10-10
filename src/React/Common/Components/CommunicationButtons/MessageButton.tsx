import React from "react";
import { ChatService } from "../../Services/ChatService.ts";
import {useChatContext} from "../../../Context/Chat/ChatContext.tsx";
import { ChatActionType } from "../../../Context/Chat/ChatReducer.ts";
import {useHomePage} from "../../../Context/HomePage/HomePageContext.tsx";
import {HomePageActionType} from "../../../Context/HomePage/HomePageReducer.ts";
import { Contact } from "../../../Models/Contact.ts";
import { useUser } from "../../../Context/User/UserContext.tsx";
import { ChatCircleIcon } from "@phosphor-icons/react";


interface MessageButtonProps{
    contact: Contact;
}

const MessageButton: React.FC<MessageButtonProps> = ({contact}) => {
    const {homeDispatch} = useHomePage();
    const {getChatByMemberId, chatDispatch} = useChatContext();
    const {user} = useUser();
    const chatService = new ChatService();

    const handleMessage = async () => {
        const chat = getChatByMemberId(contact.id);
        if (chat) {
            homeDispatch({type: HomePageActionType.SetSelectedChat, payload: chat});
        } else {
            const chat = await chatService.initializeChat(user!, contact);
            chatDispatch({type: ChatActionType.AddChat, payload: chat});
            homeDispatch({type: HomePageActionType.SetSelectedChat, payload: chat});
        }
    };

    return (
        <button
            className="flex flex-col items-center justify-center hover:bg-surface-hover px-1.5 py-1 rounded-lg"
            onClick={handleMessage}
        >
            <ChatCircleIcon className="w-5 h-5 text-fg-muted"/>
            <h3 className="font-extralight text-[0.6rem]">Message</h3>
        </button>
    );
}

export default MessageButton;
