import React from "react";
import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {ChatAction} from "./ChatReducer.ts";
import {getChatById, getChatByMemberId} from "./ChatSelectors.ts";

export type ChatState = {
    activeChatId: string | null;
    chats: ChatViewModel[];
}

export const initialChatState: ChatState = {
    activeChatId: null,
    chats: [],
};

export interface ChatContextType {
    chatState: ChatState;
    chatDispatch: React.Dispatch<ChatAction>;
}

export const ChatContext = React.createContext<ChatContextType | undefined>(undefined);
export const useChatContext = () => {
    const context = React.useContext(ChatContext);

    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }

    const {chatState, chatDispatch} = context;

    return {
        chatState,
        chatDispatch,
        getChatByMemberId: (memberId: string) => getChatByMemberId(chatState.chats, memberId),
        getChatById: (id: string) => getChatById(chatState.chats, id),
    }
}
