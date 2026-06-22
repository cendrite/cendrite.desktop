import { ChatViewModel } from '../../Models/ChatViewModel.ts';
import { MessageViewModel } from '../../Models/MessageViewModel.ts';
import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { ChatState } from './ChatContext.tsx';

export enum ChatActionType {
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
    SetActiveChat = 10,
    ClearActiveChat = 11,
    PrependMessages = 12,
}

export type ChatAction =
    | { type: ChatActionType.Init; payload: ChatViewModel[] }
    | { type: ChatActionType.AddChat; payload: ChatViewModel }
    | { type: ChatActionType.RemoveChat; payload: ChatViewModel }
    | { type: ChatActionType.AddMessage; payload: MessageViewModel }
    | { type: ChatActionType.RemoveMessage; payload: MessageViewModel }
    | { type: ChatActionType.UpdateMessage; payload: MessageViewModel }
    | { type: ChatActionType.PrependMessages; payload: { chatId: string; messages: MessageViewModel[] } }
    | { type: ChatActionType.UpdateChat; payload: ChatViewModel }
    | { type: ChatActionType.MuteChat; payload: ChatViewModel }
    | { type: ChatActionType.UnmuteChat; payload: ChatViewModel }
    | { type: ChatActionType.MarkAsRead; payload: { chatId: string; messagesIds: string[] } }
    | { type: ChatActionType.SetActiveChat; payload: { chatId: string } }
    | { type: ChatActionType.ClearActiveChat }
    | { type: ChatActionType.Clear };

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
        case ChatActionType.Init:
            return { ...state, chats: action.payload };

        case ChatActionType.SetActiveChat:
            return { ...state, activeChatId: action.payload.chatId };

        case ChatActionType.ClearActiveChat:
            return { ...state, activeChatId: null };

        case ChatActionType.AddChat:
            return { ...state, chats: [...state.chats, action.payload] };

        case ChatActionType.RemoveChat: {
            const chats = state.chats.filter((c) => c.id !== action.payload.id);
            const activeChatId = state.activeChatId === action.payload.id ? null : state.activeChatId;
            return { ...state, chats, activeChatId };
        }

        case ChatActionType.AddMessage: {
            const m = action.payload;
            const chats = state.chats.map((chat) => {
                if (chat.id !== m.chatId) return chat;
                return new ChatViewModel(chat.id, chat.chatMembers, [...chat.messages, m]);
            });
            return { ...state, chats };
        }

        case ChatActionType.PrependMessages: {
            const { chatId, messages } = action.payload;
            const chats = state.chats.map((chat) => {
                if (chat.id !== chatId) return chat;
                const existingIds = new Set(chat.messages.map((m) => m.id));
                const newMessages = messages.filter((m) => !existingIds.has(m.id));
                if (newMessages.length === 0) return chat;
                return new ChatViewModel(chat.id, chat.chatMembers, [...newMessages, ...chat.messages]);
            });
            return { ...state, chats };
        }

        case ChatActionType.MarkAsRead: {
            const chatId = action.payload.chatId;
            const chats = state.chats.map((chat) => {
                if (chat.id !== chatId) return chat;

                const updatedMessages = chat.messages.map((msg) => {
                    const shouldMark = action.payload.messagesIds.includes(msg.id);

                    return shouldMark
                        ? new MessageViewModel(
                            msg.id,
                            msg.chatId,
                            msg.senderId,
                            msg.text,
                            msg.date,
                            msg.media,
                            DeliveryStatus.Read,
                        )
                        : msg;
                });

                return new ChatViewModel(chat.id, chat.chatMembers, updatedMessages);
            });

            return { ...state, chats };
        }

        case ChatActionType.Clear:
            return { chats: [], activeChatId: null };

        default:
            return state;
    }
};
