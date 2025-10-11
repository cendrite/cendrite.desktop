import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {MessageViewModel} from "../../Models/MessageViewModel.ts";
import {DeliveryStatus} from "../../../Electron/Domain/Enums/DeliveryStatus.ts";

export enum ChatContextActionType{
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
}

export type ChatContextAction =
    | {type: ChatContextActionType.Init; payload: ChatViewModel[]}
    | {type: ChatContextActionType.AddChat; payload: ChatViewModel}
    | {type: ChatContextActionType.RemoveChat; payload: ChatViewModel}
    | {type: ChatContextActionType.AddMessage; payload: MessageViewModel}
    | {type: ChatContextActionType.RemoveMessage; payload: MessageViewModel}
    | {type: ChatContextActionType.UpdateMessage; payload: MessageViewModel}
    | {type: ChatContextActionType.UpdateChat; payload: ChatViewModel}
    | {type: ChatContextActionType.MuteChat; payload: ChatViewModel}
    | {type: ChatContextActionType.UnmuteChat; payload: ChatViewModel}
    | {type: ChatContextActionType.MarkAsRead; payload: ChatViewModel};


export const chatReducer = (state: ChatViewModel[], action: ChatContextAction): ChatViewModel[] => {
    switch (action.type) {

        case ChatContextActionType.Init:
            return action.payload;

        case ChatContextActionType.AddChat:
            return [...state, action.payload];

        case ChatContextActionType.RemoveChat:
            return state.filter(chat => chat.id !== action.payload.id);

        case ChatContextActionType.AddMessage: {
            const message = action.payload;

            return state.map(chat => {
                if (chat.id !== message.chatId) return chat;

                const updatedMessages = [...chat.messages, message];
                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });
        }

        case ChatContextActionType.RemoveMessage: {
            const message = action.payload;

            return state.map(chat => {
                if (chat.id !== message.chatId) return chat;

                const updatedMessages = chat.messages.filter(m => m.id !== message.id);
                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });
        }

        case ChatContextActionType.UpdateMessage: {
            const updatedMessage = action.payload;

            return state.map(chat => {
                if (chat.id !== updatedMessage.chatId) return chat;

                const updatedMessages = chat.messages.map(m =>
                    m.id === updatedMessage.id ? updatedMessage : m
                );

                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });
        }

        case ChatContextActionType.MarkAsRead: {
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

        case ChatContextActionType.UpdateChat:
            return state.map(chat =>
                chat.id === action.payload.id ? action.payload : chat
            );

        case ChatContextActionType.MuteChat:
            return state.map(chat => {
                if (chat.id !== action.payload.id) return chat;
                const updated = new ChatViewModel(chat.id, chat.chatMembers, chat.messages);
                updated.muted = true;
                updated.mutedTimer = action.payload.mutedTimer ?? null;
                return updated;
            });

        case ChatContextActionType.UnmuteChat:
            return state.map(chat => {
                if (chat.id !== action.payload.id) return chat;
                const updated = new ChatViewModel(chat.id, chat.chatMembers, chat.messages);
                updated.muted = false;
                updated.mutedTimer = null;
                return updated;
            });

        default:
            throw new Error(`Unknown action type: ${(action as ChatContextAction).type}`);
    }
};
