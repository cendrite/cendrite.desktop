import { useChatContext } from '../../Context/Chat/ChatContext.tsx';
import { useNotifications } from '../../Context/Notification/NotificationContext.tsx';
import { ChatViewModel } from '../../Models/ChatViewModel.ts';
import { ChatActionType } from '../../Context/Chat/ChatReducer.ts';
import { NotificationActionType } from '../../Context/Notification/NotificationReducer.ts';
import { useCallback } from 'react';
import { useUser } from '../../Context/User/UserContext.tsx';
import { ChatService } from './ChatService.ts';
import React from 'react';
import { MessageViewModel } from '../../Models/MessageViewModel.ts';

export function useMessageService() {
    const { chatDispatch } = useChatContext();
    const { user } = useUser();
    const { notificationDispatch } = useNotifications();
    const chatService = React.useMemo(() => new ChatService(), []);

    const markMessagesAsRead = useCallback(
        async (chatId: string, messages: MessageViewModel[]) => {
            console.log('Marking messages as read:', messages);
            await chatService.markRead(chatId, messages.map((m) => m.id));
            chatDispatch({ type: ChatActionType.MarkAsRead, payload: { chatId, messages } });
            notificationDispatch({ type: NotificationActionType.RemoveChat, payload: { chatId: chatId } });
        },
        [chatDispatch, notificationDispatch],
    );

    const sendMessage = useCallback(
        async (chat: ChatViewModel, text: string | null, media: string | null) => {
            const msg = await chatService.sendMessage(
                user!.userTag,
                user!.connectionId,
                user!.externalConnectionIds,
                chat.chatMembers.map((member) => member.contact.connectionIds).flat(),
                chat.chatMembers.map((member) => member.contact.id),
                chat.id,
                text,
                media,
            );

            if (msg) {
                chatDispatch({ type: ChatActionType.AddMessage, payload: msg });
            }
        },
        [chatDispatch, user, chatService],
    );

    return { markMessagesAsRead, sendMessage };
}
