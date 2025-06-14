import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import React, {useCallback, useEffect} from "react";
import {ChatContextActionType, chatReducer} from "./ChatReducer.ts";
import { ChatContext } from "./ChatContext.tsx";
import {ServerChatMessage} from "../../SignalR/Messaging/ServerChatMessage.ts";
import {useSignalMessage} from "../../SignalR/Utility/Utilities.ts";



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

    const receiveMessage = useCallback(async(msg: ServerChatMessage)=> {
        console.log("Received message in ChatProvider", msg);
    },[])

    useSignalMessage("chat", receiveMessage);

    return (
        <ChatContext.Provider value={{chats, dispatch}}>
            {children}
        </ChatContext.Provider>
    );
};