import {useChatContext} from "../../Context/Chat/ChatContext.tsx";
import {useNotifications} from "../../Context/Notification/NotificationContext.tsx";
import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {ChatContextActionType} from "../../Context/Chat/ChatReducer.ts";
import {NotificationActionType} from "../../Context/Notification/NotificationReducer.ts";
import {useCallback} from "react";
import {v4 as uuidv4, v4 as uuid} from 'uuid';
import {MessageViewModel} from "../../Models/MessageViewModel.ts";
import {DeliveryStatus} from "../../../Electron/Domain/Enums/DeliveryStatus.ts";
import {MessageHubHandler} from "../../SignalR/Messaging/MessageHubHandler.ts";
import {SignalManager} from "../../SignalR/SignalManager.ts";
import {Encryptor} from "../../Security/Encryption/Encryptor.ts";
import {ServerChatMessage} from "../../SignalR/Messaging/ServerChatMessage.ts";
import { useUser } from "../../Context/User/UserContext.tsx";

export function useMessageService() {
    const {chatDispatch} = useChatContext();
    const {user} = useUser();
    const {notificationDispatch} = useNotifications();
    const msgSender = SignalManager.getInstance().getHandler<MessageHubHandler>("Messaging");
    const encryptor = Encryptor.getInstance();

    const markMessagesAsRead = useCallback(
        async (chat: ChatViewModel) => {
            chatDispatch({type: ChatContextActionType.MarkAsRead, payload: chat})
            notificationDispatch({type: NotificationActionType.RemoveChat, payload: {chatId: chat.id}})
            console.log(`Chat ${chat.id} marked as read for user ${user!.connectionId}`);
        },
        [chatDispatch, notificationDispatch]
    )

    const sendMessage = useCallback(
        async (chat: ChatViewModel, text: string | null, media: string | null) => {
            if (!text && !media) return;

            const message: MessageViewModel = {
                id: uuid().toString(),
                chatId: chat.id,
                senderId: user!.connectionId,
                text: text || "",
                date: new Date(),
                deliveryStatus: DeliveryStatus.Sent,
                media: media || null
            }
            chatDispatch({type: ChatContextActionType.AddMessage, payload: message});

            const content = encryptor.encrypt({text: text, media: media});
            const messages: ServerChatMessage[] = [];
            const connectionIds = [...chat.connectionIds, user!.externalConnectionIds].flat();

            for (const connectionId of connectionIds) {
                messages.push(new ServerChatMessage(
                    message.id,
                    chat.id,
                    user!.connectionId,
                    connectionId,
                    content,
                    new Date(),
                    uuidv4().toString()));
            }

            const receipt = await msgSender.sendMessage(messages);
            console.log("Message sent, receipt:", receipt);
        },
        [chatDispatch, msgSender]
    )

    return {markMessagesAsRead, sendMessage}
}
