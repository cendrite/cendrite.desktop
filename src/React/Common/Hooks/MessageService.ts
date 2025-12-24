import { useChatContext } from '../../Context/Chat/ChatContext.tsx';
import { useNotifications } from '../../Context/Notification/NotificationContext.tsx';
import { ChatViewModel } from '../../Models/ChatViewModel.ts';
import { ChatActionType } from '../../Context/Chat/ChatReducer.ts';
import { NotificationActionType } from '../../Context/Notification/NotificationReducer.ts';
import { useCallback } from 'react';
import { useUser } from '../../Context/User/UserContext.tsx';
import React from 'react';
import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { ChatService } from '../Services/ChatService.ts';

export function useMessageService() {
    const { chatDispatch } = useChatContext();
    const { user } = useUser();
    const { notificationDispatch } = useNotifications();
    const chatService = React.useMemo(() => new ChatService(), []);

    const markMessagesAsRead = useCallback(
        async (chat: ChatViewModel) => {
            const msgIds = await chatService.updateDeliveryStatus(user!, chat, DeliveryStatus.Read);
            if (msgIds.length === 0) return;
            chatDispatch({ type: ChatActionType.MarkAsRead, payload: { chatId: chat.id, messagesIds: msgIds } });
            notificationDispatch({ type: NotificationActionType.RemoveChat, payload: { chatId: chat.id } });
        },
        [chatService, user, chatDispatch, notificationDispatch],
    );

    const sendMessage = useCallback(
        async (chat: ChatViewModel, text: string | null, media: string | null) => {
            const msg = await chatService.sendMessage(
                user!,
                chat.chatMembers.map((member) => member.contact.connectionIds).flat(),
                chat.chatMembers.map((member) => member.contact.id),
                chat.id,
                text,
                media,
            );

            if (msg) {
                console.log('Sent message:', msg);
                chatDispatch({ type: ChatActionType.AddMessage, payload: msg });
            }
        },
        [chatDispatch, user, chatService],
    );

    return { markMessagesAsRead, sendMessage };
}
