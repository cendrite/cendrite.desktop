import React, { useEffect } from 'react';
import { ChatActionType, chatReducer } from './ChatReducer.ts';
import { ChatContext, initialChatState } from './ChatContext.tsx';
import { useChatEvents } from './ChatEvents.ts';
import { ChatService } from '../../Common/Services/ChatService.ts';
import { useContacts } from '../Contacts/ContactContext.tsx';
import { useHomePage } from '../HomePage/HomePageContext.tsx';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [chatState, chatDispatch] = React.useReducer(chatReducer, initialChatState);
    const { contacts } = useContacts();
    const { homeDispatch } = useHomePage();
    const chatService = React.useMemo(() => new ChatService(), []);

    useChatEvents(chatState.chats, chatState.activeChatId, chatDispatch, homeDispatch);

    useEffect(() => {
        chatService.getChats(contacts).then((loadedChats) => {
            chatDispatch({ type: ChatActionType.Init, payload: loadedChats });
        });
    }, [chatService, contacts]);

    return <ChatContext.Provider value={{ chatState, chatDispatch }}>{children}</ChatContext.Provider>;
};
