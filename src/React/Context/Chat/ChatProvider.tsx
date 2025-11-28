import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import React, {useCallback, useEffect} from "react";
import {ChatContextActionType, chatReducer,} from "./ChatReducer.ts";
import {ChatContext} from "./ChatContext.tsx";
import {ServerChatMessage} from "../../SignalR/Messaging/ServerChatMessage.ts";
import {useSignalMessage} from "../../SignalR/Utility/Utilities.ts";
import {Encryptor} from "../../Security/Encryption/Encryptor.ts";
import {MessageViewModel} from "../../Models/MessageViewModel.ts";
import {DeliveryStatus} from "../../../Electron/Domain/Enums/DeliveryStatus.ts";
import {ChatMemberViewModel} from "../../Models/ChatMemberViewModel.ts";
import {v4 as uuid} from 'uuid';
import {useNotifications} from "../Notification/NotificationContext.tsx";
import {NotificationActionType} from "../Notification/NotificationReducer.ts";
import { useContacts } from "../Contacts/ContactContext.tsx";


export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [chats, chatDispatch] = React.useReducer(chatReducer, []);
    const {getContactByConnectionId: getByConnectionId} = useContacts();
    const {notificationDispatch} = useNotifications();

    const encryptor = Encryptor.getInstance();


    useEffect(() => {
        const loadChats = async (): Promise<ChatViewModel[]> => {
            // some chat loading
            return [];
        }
        loadChats().then(loadedChats => {
            chatDispatch({type: ChatContextActionType.Init, payload: loadedChats});
        })
    }, []);

    const receiveMessage = useCallback(async (msg: ServerChatMessage) => {
        const decryptedMessage = encryptor.decrypt(msg.content);
        console.log("received message: ", msg)
        const mappedMsg = new MessageViewModel(
            msg.id,
            msg.chatId,
            msg.senderId,
            decryptedMessage.text,
            msg.timestamp,
            DeliveryStatus.Received,
            decryptedMessage.media || null
        );
        console.log("mapped message:", mappedMsg);

        let chat = chats.find(chat => chat.id === msg.chatId);
        if (!chat) {
            const contact = getByConnectionId(msg.senderId);
            if (!contact) {
                console.warn(`Contact with ID ${msg.senderId} not found.`);
                return;
            }
            const member = new ChatMemberViewModel(
                uuid().toString(),
                1,
                contact.displayName,
                contact);

            chat = new ChatViewModel(msg.chatId, [member], [mappedMsg])
            chatDispatch({type: ChatContextActionType.AddChat, payload: chat});
        } else {
            chatDispatch({type: ChatContextActionType.AddMessage, payload: mappedMsg});
        }
        notificationDispatch({type: NotificationActionType.AddChat, payload: {chatId: chat.id}})
    }, [encryptor, getByConnectionId, chats])

    useSignalMessage("chat", receiveMessage);

    return (
        <ChatContext.Provider value={{chats, chatDispatch}}>
            {children}
        </ChatContext.Provider>
    );
};
