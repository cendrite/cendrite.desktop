import { useCallback } from 'react';
import { ChatViewModel } from '../../Models/ChatViewModel';
import { ChatAction, ChatActionType } from './ChatReducer';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { useContacts } from '../Contacts/ContactContext';
import { useNotifications } from '../Notification/NotificationContext';
import { getChat, getChatByMemberId } from './ChatSelectors';
import { useUser } from '../User/UserContext';
import { ChatService } from '../../Common/Services/ChatService';
import React from 'react';
import { PayloadType, ServerMessage } from '../../SignalR/Messaging/ServerMessage';
import { useSignalEvent, useSignalMessage } from '../../SignalR/Utility/Utilities';
import { ChangeEventType } from '../../SignalR/ChangeEvent/ChangeEventType';
import { ChangeEvent } from '../../SignalR/ChangeEvent/ChangeEvent';
import { FriendDeletedEvent } from '../../SignalR/ChangeEvent/EventData';
import { HomePageAction, HomePageActionType } from '../HomePage/HomePageReducer';

export function useChatEvents(
    chats: ChatViewModel[],
    activeChatId: string | null,
    chatDispatch: React.Dispatch<ChatAction>,
    homeDispatch: React.Dispatch<HomePageAction>,
) {
    const { contacts } = useContacts();
    const { notificationDispatch } = useNotifications();
    const { user } = useUser();
    const chatService = React.useMemo(() => new ChatService(), []);

    const handleReceiveMessage = useCallback(
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

    const handleFriendDeleted = useCallback(
        (evt: ChangeEvent<FriendDeletedEvent>) => {
            const contactId = user?.userTag === evt.data.tag ? evt.data.deletedBy : evt.data.tag;
            const chat = getChatByMemberId(chats, contactId);
            if (!chat) return;
            chatDispatch({ type: ChatActionType.RemoveChat, payload: chat });
            homeDispatch({ type: HomePageActionType.Clear });
        },
        [chats, user, chatDispatch, homeDispatch],
    );

    useSignalMessage(PayloadType.ChatMessage, handleReceiveMessage);
    useSignalEvent<FriendDeletedEvent>(ChangeEventType.FriendRemoved, handleFriendDeleted);
}
