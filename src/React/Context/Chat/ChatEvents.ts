import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { ServerChatMessage } from '../../SignalR/Messaging/ServerChatMessage';
import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus';
import { MessageViewModel } from '../../Models/MessageViewModel';
import { ChatViewModel } from '../../Models/ChatViewModel';
import { ChatAction, ChatActionType } from './ChatReducer';
import { ChatMemberViewModel } from '../../Models/ChatMemberViewModel';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { useContacts } from '../Contacts/ContactContext';
import { useNotifications } from '../Notification/NotificationContext';
import { getChat } from './ChatSelectors';
import { useUser } from '../User/UserContext';
import { SessionManager } from '../../Security/Encryption/SessionManager';
import { CreateChatCommand } from '../../../Electron/Application/Features/Chat/Commands/Create/CreateChatCommand';
import { AddMessageCommand } from '../../../Electron/Application/Features/Chat/Commands/AddMessage/AddMessageCommand';

export function useChatEvents(
    chats: ChatViewModel[],
    activeChatId: string | null,
    chatDispatch: React.Dispatch<ChatAction>,
) {
    const { getContactById } = useContacts();
    const { notificationDispatch } = useNotifications();
    const { user } = useUser();

    const receiveMessage = useCallback(
        async (msg: ServerChatMessage) => {
            const sessionManager = new SessionManager(msg.senderId);
            const decryptedMessage = await sessionManager.decrypt(msg.content);

            const mappedMsg = MessageViewModel.mapFromDecrypted(msg, decryptedMessage);

            let chat = getChat(chats, msg.chatId);

            if (!chat) {
                const contactId = decryptedMessage.participants.find((p) => p !== user!.userTag);
                const contact = getContactById(contactId!);
                if (!contact) {
                    console.warn(`Contact with ID ${msg.senderId} not found.`);
                    return;
                }
                const member = new ChatMemberViewModel(uuid().toString(), 1, contact.displayName, contact);

                chat = new ChatViewModel(msg.chatId, [member], [mappedMsg]);
                await addSingleChat(chat);
                await addMessageToChat(chat.id, mappedMsg);
            } else {
                await addMessageToChat(chat.id, mappedMsg);
            }

            if (activeChatId !== chat.id) {
                notificationDispatch({ type: NotificationActionType.AddChat, payload: { chatId: chat.id } });
            }
        },
        [activeChatId, chats, chatDispatch, getContactById, notificationDispatch, user],
    );

    return { receiveMessage };

    async function addSingleChat(chat: ChatViewModel): Promise<void> {
        chatDispatch({ type: ChatActionType.AddChat, payload: chat });
        await window.electron.sendRequestAsync(
            new CreateChatCommand(
                chat.id,
                chat.chatMembers[0].contact.id,
                uuid().toString(),
                chat.chatMembers[0].privilege,
            ),
        );
    }

    async function addMessageToChat(chatId: string, message: MessageViewModel): Promise<void> {
        console.log('Adding message to chat:', chatId, message);
        chatDispatch({ type: ChatActionType.AddMessage, payload: message });
        await window.electron.sendRequestAsync(
            new AddMessageCommand(
                chatId,
                message.id,
                message.senderId,
                message.text,
                message.date,
                message.deliveryStatus,
                message.media,
            ),
        );
    }
}
