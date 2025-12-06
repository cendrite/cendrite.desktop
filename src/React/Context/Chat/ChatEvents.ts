import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { ServerChatMessage } from '../../SignalR/Messaging/ServerChatMessage';
import { Encryptor } from '../../Security/Encryption/Encryptor';
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

export function useChatEvents(chats: ChatViewModel[], chatDispatch: React.Dispatch<ChatAction>) {
    const { getContactById } = useContacts();
    const { notificationDispatch } = useNotifications();
    const { user } = useUser();
    const encryptor = Encryptor.getInstance();

    const receiveMessage = useCallback(
        async (msg: ServerChatMessage) => {
            const sessionManager = new SessionManager(msg.senderId);
            const decryptedMessage = await sessionManager.decrypt(msg.content);

            const mappedMsg = new MessageViewModel(
                msg.id,
                msg.chatId,
                msg.senderId,
                decryptedMessage.text,
                msg.timestamp,
                DeliveryStatus.Received,
                decryptedMessage.media || null,
            );

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
                chatDispatch({ type: ChatActionType.AddChat, payload: chat });
            } else {
                chatDispatch({ type: ChatActionType.AddMessage, payload: mappedMsg });
            }
            notificationDispatch({ type: NotificationActionType.AddChat, payload: { chatId: chat.id } });
        },
        [encryptor, getContactById, chats],
    );

    return { receiveMessage };
}
