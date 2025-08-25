import React from "react";
import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {ChatContextAction} from "./ChatReducer.ts";
import {getChatById, getChatByMemberId} from "./ChatSelectors.ts";

export interface ChatContextType {
    chats: ChatViewModel[];
    chatDispatch: React.Dispatch<ChatContextAction>;
}

export const ChatContext = React.createContext<ChatContextType | undefined>(undefined);
export const useChatContext = () => {
    const context = React.useContext(ChatContext);

    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }

    const {chats, chatDispatch} = context;

    return {
        chats,
        chatDispatch,
        getChatByMemberId: (memberId: string) => getChatByMemberId(chats, memberId),
        getChatById: (id: string) => getChatById(chats, id),
    }
}