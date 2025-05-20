import {Chat} from "../Models/ChatModels";
import React, {useEffect} from "react";

interface ChatContextType {
    chats: Chat[];
}


export const ChatContext = React.createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [chats, setChats] = React.useState<Chat[]>([]);

    useEffect(() => {
        setChats([]);
    }, []);

    return (
        <ChatContext.Provider value={{chats}}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = React.useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
}