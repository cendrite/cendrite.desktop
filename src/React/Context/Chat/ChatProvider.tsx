import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import React, {useEffect} from "react";
import {ChatContextActionType, chatReducer} from "./ChatReducer.ts";
import { ChatContext } from "./ChatContext.tsx";


export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [chats, dispatch] = React.useReducer(chatReducer, []);

    useEffect(() => {
        const loadChats = async (): Promise<ChatViewModel[]> => {
            // some chat loading
            return [];
        }
        loadChats().then(loadedChats=> {
            dispatch({type: ChatContextActionType.Init, payload: loadedChats});
        })
    }, []);

    return (
        <ChatContext.Provider value={{chats, dispatch}}>
            {children}
        </ChatContext.Provider>
    );
};