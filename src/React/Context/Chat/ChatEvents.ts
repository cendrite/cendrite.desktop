import { useCallback } from 'react';
import { ServerChatMessage } from '../../SignalR/Messaging/ServerChatMessage';
import { ChatViewModel } from '../../Models/ChatViewModel';
import { ChatAction, ChatActionType } from './ChatReducer';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { useContacts } from '../Contacts/ContactContext';
import { useNotifications } from '../Notification/NotificationContext';
import { getChat } from './ChatSelectors';
import { useUser } from '../User/UserContext';
import { ChatService } from '../../Common/Services/ChatService';
import React from 'react';

export function useChatEvents(
    chats: ChatViewModel[],
    activeChatId: string | null,
    chatDispatch: React.Dispatch<ChatAction>,
) {
    const { contacts } = useContacts();
    const { notificationDispatch } = useNotifications();
    const { user } = useUser();
    const chatService = React.useMemo(() => new ChatService(), []);

    const receiveMessage = useCallback(
        async (msg: ServerChatMessage) => {
            let chat = getChat(chats, msg.chatId);

            if (!chat) {
                chat = await chatService.startChat(user!, contacts, msg);
                if (chat === null) return;
                notificationDispatch({ type: NotificationActionType.AddChat, payload: { chatId: chat.id } });
                chatDispatch({ type: ChatActionType.AddChat, payload: chat });
            } else {
                const message = await chatService.addMessage(msg, chat.id);
                chatDispatch({ type: ChatActionType.AddMessage, payload: message });
            }

            if (activeChatId !== chat.id) {
                notificationDispatch({ type: NotificationActionType.AddChat, payload: { chatId: chat.id } });
            }
        },
        [activeChatId, chats, chatDispatch, contacts, notificationDispatch, user],
    );

    return { receiveMessage };
}
