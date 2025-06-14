import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import React, {useCallback, useEffect} from "react";
import {ChatContextActionType, chatReducer} from "./ChatReducer.ts";
import {ChatContext} from "./ChatContext.tsx";
import {ServerChatMessage} from "../../SignalR/Messaging/ServerChatMessage.ts";
import {useSignalMessage} from "../../SignalR/Utility/Utilities.ts";
import {Encryptor} from "../../Security/Encryption/Encryptor.ts";
import {MessageViewModel} from "../../Models/MessageViewModel.ts";
import {DeliveryStatus} from "../../../Electron/Domain/Enums/DeliveryStatus.ts";
import {useContacts} from "../ContactContext.tsx";
import {ChatMemberViewModel} from "../../Models/ChatMemberViewModel.ts";
import {v4 as uuid} from 'uuid';


export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [chats, dispatch] = React.useReducer(chatReducer, []);
    const {contacts} = useContacts()
    const encryptor = Encryptor.getInstance();


    useEffect(() => {
        const loadChats = async (): Promise<ChatViewModel[]> => {
            // some chat loading
            return [];
        }
        loadChats().then(loadedChats=> {
            dispatch({type: ChatContextActionType.Init, payload: loadedChats});
        })
    }, []);

    const receiveMessage = useCallback(async(msg: ServerChatMessage)=> {
        const decryptedMessage = encryptor.decrypt(msg.content);
        const mappedMsg = new MessageViewModel(
            msg.id,
            msg.chatId,
            msg.senderId,
            decryptedMessage.text,
            msg.timestamp,
            DeliveryStatus.Received,
            decryptedMessage.media || null
        );
        const contact = contacts.find(c => c.connectionIds.includes(msg.senderId));
        for(const c of contacts){
            console.log("c", c);
        }
        if (!contact) {
            console.warn(`Contact with ID ${msg.senderId} not found.`);
            return;
        }
        const member = new ChatMemberViewModel(
            uuid().toString(),
            1,
            contact.displayName,
            contact,
        )
        const existingChat  = chats.find(chat => chat.id === msg.chatId);
        if(!existingChat){
            const newChat = new ChatViewModel(msg.chatId, [member], [mappedMsg])
            dispatch({type: ChatContextActionType.AddChat, payload: newChat });
        }
        else{
            dispatch({type: ChatContextActionType.AddMessage, payload: mappedMsg });
        }

        dispatch({type: ChatContextActionType.AddMessage, payload: mappedMsg});
    },[encryptor])

    useSignalMessage("chat", receiveMessage);

    return (
        <ChatContext.Provider value={{chats, dispatch}}>
            {children}
        </ChatContext.Provider>
    );
};