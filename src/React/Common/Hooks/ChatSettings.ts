import React from 'react';
import { useCallback } from 'react';
import { ChatService } from '../Services/ChatService';
import { useChatContext } from '@/React/Context/Chat/ChatContext';
import { ChatViewModel } from '@/React/Models/ChatViewModel';
import { ChatActionType } from '@/React/Context/Chat/ChatReducer';
import { useHomePage } from '@/React/Context/HomePage/HomePageContext';
import { HomePageActionType } from '@/React/Context/HomePage/HomePageReducer';
import { useNotifications } from '@/React/Context/Notification/NotificationContext';
import { NotificationActionType } from '@/React/Context/Notification/NotificationReducer';

export function useChatSettings() {
    const chatService = React.useMemo(() => new ChatService(), []);
    const { chatDispatch } = useChatContext();
    const { homeDispatch } = useHomePage();
    const { notificationDispatch } = useNotifications();

    const deleteChat = useCallback(
        async (chat: ChatViewModel) => {
            await chatService.deleteChat(chat.id);
            chatDispatch({ type: ChatActionType.RemoveChat, payload: chat });
            chatDispatch({ type: ChatActionType.ClearActiveChat });
            homeDispatch({ type: HomePageActionType.Clear });
            notificationDispatch({ type: NotificationActionType.RemoveChat, payload: { chatId: chat.id } });
        },
        [chatService, chatDispatch, homeDispatch, notificationDispatch],
    );

    const muteChat = useCallback((_chatId: string, _duration: number) => {
        // Implementation for muting a chat
    }, []);

    const archiveChat = useCallback((_chatId: string) => {
        // Implementation for archiving a chat
    }, []);

    const setMessageTtl = useCallback((_chatId: string, _ttl: number) => {
        // Implementation for setting message TTL
    }, []);

    return { deleteChat, muteChat, archiveChat, setMessageTtl };
}
