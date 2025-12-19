import { ChatNotification, FriendRequestNotification, NotificationState } from './NotificationState';

export enum NotificationActionType {
    AddChat = 0,
    RemoveChat = 1,
    AddFriendRequest = 2,
    RemoveFriendRequest = 3,
    Clear = 4,
}

export type NotificationAction =
    | { type: NotificationActionType.AddChat; payload: ChatNotification }
    | { type: NotificationActionType.RemoveChat; payload: ChatNotification }
    | { type: NotificationActionType.AddFriendRequest; payload: FriendRequestNotification }
    | { type: NotificationActionType.RemoveFriendRequest; payload: FriendRequestNotification }
    | { type: NotificationActionType.Clear };

export function reducer(state: NotificationState, action: NotificationAction): NotificationState {
    function withCounts(state: NotificationState): NotificationState {
        return {
            ...state,
            count: {
                chats: state.chatNotifications.length,
                friendRequests: state.friendRequestNotifications.length,
                sidebar: state.chatNotifications.length + state.friendRequestNotifications.length,
            },
        };
    }

    switch (action.type) {
        case NotificationActionType.RemoveChat: {
            const chat = state.chatNotifications.find((n) => n.chatId === action.payload.chatId);
            if(!chat) console.log('Chat notification not found for removal:', action.payload.chatId);
            const chatNotifications = state.chatNotifications.filter((n) => n.chatId !== action.payload.chatId);

            if (chatNotifications.length === state.chatNotifications.length) return state;

            return withCounts({ ...state, chatNotifications });
        }

        case NotificationActionType.RemoveFriendRequest: {
            const friendRequestNotifications = state.friendRequestNotifications.filter(
                (n) => n.userTag !== action.payload.userTag,
            );
            if (friendRequestNotifications.length === state.friendRequestNotifications.length) return state;

            return withCounts({ ...state, friendRequestNotifications });
        }

        case NotificationActionType.AddChat: {
            const exists = state.chatNotifications.some((n) => n.chatId === action.payload.chatId);
            if (exists) return state;

            return withCounts({
                ...state,
                chatNotifications: [...state.chatNotifications, action.payload],
            });
        }

        case NotificationActionType.AddFriendRequest: {
            const exists = state.friendRequestNotifications.some((n) => n.userTag === action.payload.userTag);
            if (exists) return state;

            return withCounts({
                ...state,
                friendRequestNotifications: [...state.friendRequestNotifications, action.payload],
            });
        }

        case NotificationActionType.Clear:
            return {
                chatNotifications: [],
                friendRequestNotifications: [],
                count: {
                    chats: 0,
                    friendRequests: 0,
                    sidebar: 0,
                },
            };

        default:
            throw new Error(`Unknown action type in NotificationReducer.ts: ${(action as NotificationAction).type}`);
    }
}
