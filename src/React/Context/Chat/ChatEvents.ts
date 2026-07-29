import { useCallback, useEffect, useRef } from 'react';
import { ChatViewModel } from '../../Models/ChatViewModel';
import { ChatAction, ChatActionType } from './ChatReducer';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { useContacts } from '../Contacts/ContactContext';
import { useNotifications } from '../Notification/NotificationContext';
import { getChat, getChatByMemberId } from './ChatSelectors';
import { useUser } from '../User/UserContext';
import { ChatService } from '../../Common/Services/ChatService';
import React from 'react';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { HomePageAction, HomePageActionType } from '../HomePage/HomePageReducer';
import { MessageContract } from '../../../Electron/Application/Contracts/Models/MessageContract';
import { MessageViewModel } from '../../Models/MessageViewModel';
import { ChangeEvent } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEvent';
import { FriendDeletedEvent } from '../../../Electron/Infrastructure/Signal/ChangeEvent/EventData';
import { ChangeEventType } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEventType';

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
        async (msg: MessageContract) => {
            let chat = getChat(chats, msg.chatId);

            if (!chat) {
                const loaded = await chatService.getChats(contacts);
                chat = loaded.find((c) => c.id === msg.chatId) ?? null;
                if (!chat) return;
                chatDispatch({ type: ChatActionType.AddChat, payload: chat });
            } else {
                chatDispatch({
                    type: ChatActionType.AddMessage,
                    payload: MessageViewModel.mapFromContract(msg),
                });
            }

            if (activeChatId !== chat.id && !user?.IsUserConnectionId(msg.senderId)) {
                notificationDispatch({ type: NotificationActionType.AddChat, payload: { chatId: chat.id } });
            }
        },
        [activeChatId, chats, chatDispatch, contacts, notificationDispatch, user, chatService],
    );

    const handlerRef = useRef(handleReceiveMessage);
    handlerRef.current = handleReceiveMessage;

    useEffect(() => {
        return window.electron.on('hubMessage', (msg) => {
            void handlerRef.current(msg);
        });
    }, []);

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

    useSignalEvent<FriendDeletedEvent>(ChangeEventType.FriendRemoved, handleFriendDeleted);
}
