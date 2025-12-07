import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import React, {useEffect} from "react";
import {ChatActionType, chatReducer,} from "./ChatReducer.ts";
import {ChatContext} from "./ChatContext.tsx";
import {useSignalMessage} from "../../SignalR/Utility/Utilities.ts";
import { useChatEvents } from "./ChatEvents.ts";


export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [chats, chatDispatch] = React.useReducer(chatReducer, []);
    const {receiveMessage} = useChatEvents(chats, chatDispatch);


    useEffect(() => {
        const loadChats = async (): Promise<ChatViewModel[]> => {
            return [];
        }

        loadChats().then(loadedChats => {
            chatDispatch({type: ChatActionType.Init, payload: loadedChats});
        })
    }, []);

    useSignalMessage("chat", receiveMessage);

    return (
        <ChatContext.Provider value={{chats, chatDispatch}}>
            {children}
        </ChatContext.Provider>
    );
};
