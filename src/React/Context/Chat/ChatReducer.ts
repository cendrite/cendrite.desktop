import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {MessageViewModel} from "../../Models/MessageViewModel.ts";
import {DeliveryStatus} from "../../../Electron/Domain/Enums/DeliveryStatus.ts";

export enum ChatActionType{
    Init = -1,
    AddChat = 0,
    RemoveChat = 1,
    AddMessage = 2,
    RemoveMessage = 3,
    UpdateMessage = 4,
    UpdateChat = 5,
    MuteChat = 6,
    UnmuteChat = 7,
    MarkAsRead = 8,
    Clear = 9,
}

export type ChatAction =
    | {type: ChatActionType.Init; payload: ChatViewModel[]}
    | {type: ChatActionType.AddChat; payload: ChatViewModel}
    | {type: ChatActionType.RemoveChat; payload: ChatViewModel}
    | {type: ChatActionType.AddMessage; payload: MessageViewModel}
    | {type: ChatActionType.RemoveMessage; payload: MessageViewModel}
    | {type: ChatActionType.UpdateMessage; payload: MessageViewModel}
    | {type: ChatActionType.UpdateChat; payload: ChatViewModel}
    | {type: ChatActionType.MuteChat; payload: ChatViewModel}
    | {type: ChatActionType.UnmuteChat; payload: ChatViewModel}
    | {type: ChatActionType.MarkAsRead; payload: ChatViewModel}
    | {type: ChatActionType.Clear};


export const chatReducer = (state: ChatViewModel[], action: ChatAction): ChatViewModel[] => {
    switch (action.type) {

        case ChatActionType.Init:
            return action.payload;

        case ChatActionType.AddChat:
            return [...state, action.payload];

        case ChatActionType.RemoveChat:
            return state.filter(chat => chat.id !== action.payload.id);

        case ChatActionType.AddMessage: {
            const message = action.payload;

            return state.map(chat => {
                if (chat.id !== message.chatId) return chat;

                const updatedMessages = [...chat.messages, message];
                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });
        }

        case ChatActionType.RemoveMessage: {
            const message = action.payload;

            return state.map(chat => {
                if (chat.id !== message.chatId) return chat;

                const updatedMessages = chat.messages.filter(m => m.id !== message.id);
                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });
        }

        case ChatActionType.UpdateMessage: {
            const updatedMessage = action.payload;

            return state.map(chat => {
                if (chat.id !== updatedMessage.chatId) return chat;

                const updatedMessages = chat.messages.map(m =>
                    m.id === updatedMessage.id ? updatedMessage : m
                );

                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });
        }

        case ChatActionType.MarkAsRead: {
            const updateChat: ChatViewModel = action.payload;
            return state.map(chat => {
                if (chat.id !== updateChat.id) return chat;

                const updatedMessages = chat.messages.map(msg => {
                    if (msg.deliveryStatus === DeliveryStatus.Received) {
                        return new MessageViewModel(
                            msg.id,
                            msg.chatId,
                            msg.senderId,
                            msg.text,
                            msg.date,
                            DeliveryStatus.Read,
                            msg.media
                        );
                    }
                    return msg;
                });
                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });
        }

        case ChatActionType.UpdateChat:
            return state.map(chat =>
                chat.id === action.payload.id ? action.payload : chat
            );

        case ChatActionType.MuteChat:
            return state.map(chat => {
                if (chat.id !== action.payload.id) return chat;
                const updated = new ChatViewModel(chat.id, chat.chatMembers, chat.messages);
                updated.muted = true;
                updated.mutedTimer = action.payload.mutedTimer ?? null;
                return updated;
            });

        case ChatActionType.UnmuteChat:
            return state.map(chat => {
                if (chat.id !== action.payload.id) return chat;
                const updated = new ChatViewModel(chat.id, chat.chatMembers, chat.messages);
                updated.muted = false;
                updated.mutedTimer = null;
                return updated;
            });

        case ChatActionType.Clear:
            return [];

        default:
            throw new Error(`Unknown action type: ${(action as ChatAction).type}`);
    }
};
