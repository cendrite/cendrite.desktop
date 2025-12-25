import { useCallback } from 'react';
import { ChatViewModel } from '../../Models/ChatViewModel';
import { ChatAction, ChatActionType } from './ChatReducer';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { useContacts } from '../Contacts/ContactContext';
import { useNotifications } from '../Notification/NotificationContext';
import { getChat } from './ChatSelectors';
import { useUser } from '../User/UserContext';
import { ChatService } from '../../Common/Services/ChatService';
import React from 'react';
import { ServerMessage } from '../../SignalR/Messaging/ServerMessage';

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
        async (msg: ServerMessage) => {
            let chat = getChat(chats, msg.ChatId);

            if (!chat) {
                chat = await chatService.startChat(user!, contacts, msg);
                if (chat === null) return;
                chatDispatch({ type: ChatActionType.AddChat, payload: chat });
            } else {
                const message = await chatService.addMessage(user!, msg, chat.id);
                chatDispatch({ type: ChatActionType.AddMessage, payload: message });
            }

            if (activeChatId !== chat.id && !user?.IsUserConnectionId(msg.senderId)) {
                notificationDispatch({ type: NotificationActionType.AddChat, payload: { chatId: chat.id } });
            }
        },
        [activeChatId, chats, chatDispatch, contacts, notificationDispatch, user],
    );

    return { receiveMessage };
}
