import { useChatContext } from '../../Context/Chat/ChatContext.tsx';
import { useNotifications } from '../../Context/Notification/NotificationContext.tsx';
import { ChatViewModel } from '../../Models/ChatViewModel.ts';
import { ChatActionType } from '../../Context/Chat/ChatReducer.ts';
import { NotificationActionType } from '../../Context/Notification/NotificationReducer.ts';
import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { MessageViewModel } from '../../Models/MessageViewModel.ts';
import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { MessageHubHandler } from '../../SignalR/Messaging/MessageHubHandler.ts';
import { SignalManager } from '../../SignalR/SignalManager.ts';
import { MessagePayload, ServerChatMessage } from '../../SignalR/Messaging/ServerChatMessage.ts';
import { useUser } from '../../Context/User/UserContext.tsx';
import { SessionManager } from '../../Security/Encryption/SessionManager.ts';
import { AddMessageCommand } from '../../../Electron/Application/Features/Chat/Commands/AddMessage/AddMessageCommand.ts';

export function useMessageService() {
    const { chatDispatch } = useChatContext();
    const { user } = useUser();
    const { notificationDispatch } = useNotifications();
    const msgSender = SignalManager.getInstance().getHandler<MessageHubHandler>('Messaging');

    const markMessagesAsRead = useCallback(
        async (chat: ChatViewModel) => {
            chatDispatch({ type: ChatActionType.MarkAsRead, payload: chat });
            notificationDispatch({ type: NotificationActionType.RemoveChat, payload: { chatId: chat.id } });
            console.log(`Chat ${chat.id} marked as read for user ${user!.connectionId}`);
        },
        [chatDispatch, notificationDispatch],
    );

    const sendMessage = useCallback(
        async (chat: ChatViewModel, text: string | null, media: string | null) => {
            if (!text && !media) return;

            const message: MessageViewModel = {
                id: uuid().toString(),
                chatId: chat.id,
                senderId: user!.connectionId,
                text: text || '',
                date: new Date(),
                deliveryStatus: DeliveryStatus.Sent,
                media: media || null,
                messageToken: uuid().toString(),
            };

            const participants = generateParticipantList(chat);

            await addMessage(message, chat.id);

            const messages: ServerChatMessage[] = [];
            const connectionIds = [...chat.connectionIds, user!.externalConnectionIds].flat();

            for (const connectionId of connectionIds) {
                const manager = new SessionManager(connectionId);

                const encryptedContent = await manager.encrypt(
                    new MessagePayload(message.text, message.media, participants),
                );

                messages.push(
                    new ServerChatMessage(
                        message.id,
                        chat.id,
                        user!.connectionId,
                        connectionId,
                        encryptedContent,
                        new Date(),
                        uuid().toString(),
                    ),
                );
            }

            const receipt = await msgSender.sendMessage(messages);
            console.log('Message sent, receipt:', receipt);
        },
        [chatDispatch, msgSender],
    );

    const generateParticipantList = (chat: ChatViewModel): string[] => {
        const participantIds = new Set<string>();
        chat.chatMembers.forEach((member) => {
            participantIds.add(member.contact.id);
        });

        participantIds.add(user!.userTag);
        return Array.from(participantIds);
    };

    async function addMessage(msg: MessageViewModel, chatId: string): Promise<void> {
        chatDispatch({ type: ChatActionType.AddMessage, payload: msg });
        await window.electron.sendRequestAsync(
            new AddMessageCommand(
                chatId,
                msg.id,
                msg.senderId,
                msg.text,
                msg.date,
                msg.deliveryStatus,
                msg.media,
                msg.messageToken,
            ),
        );
    }

    return { markMessagesAsRead, sendMessage };
}
