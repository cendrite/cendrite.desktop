import React, { useEffect } from 'react';
import { ChatActionType, chatReducer } from './ChatReducer.ts';
import { ChatContext, initialChatState } from './ChatContext.tsx';
import { useSignalMessage } from '../../SignalR/Utility/Utilities.ts';
import { useChatEvents } from './ChatEvents.ts';
import { ChatService } from '../../Common/Services/ChatService.ts';
import { useContacts } from '../Contacts/ContactContext.tsx';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [chatState, chatDispatch] = React.useReducer(chatReducer, initialChatState);
    const { receiveMessage } = useChatEvents(chatState.chats, chatState.activeChatId, chatDispatch);
    const { contacts } = useContacts();
    const chatService = React.useMemo(() => new ChatService(), []);

    useEffect(() => {
        chatService.getChats(contacts).then((loadedChats) => {
            chatDispatch({ type: ChatActionType.Init, payload: loadedChats });
        });
    }, [chatService, contacts]);

    useSignalMessage('chat', receiveMessage);

    return <ChatContext.Provider value={{ chatState, chatDispatch }}>{children}</ChatContext.Provider>;
};
