import {ChatNotification, FriendRequestNotification, NotificationState} from "./NotificationState";

export enum NotificationActionType {
    AddChat = 0,
    RemoveChat = 1,
    AddFriendRequest = 2,
    RemoveFriendRequest = 3,
}

export type NotificationAction =
    | { type: NotificationActionType.AddChat; payload: ChatNotification }
    | { type: NotificationActionType.RemoveChat; payload: ChatNotification }
    | { type: NotificationActionType.AddFriendRequest; payload: FriendRequestNotification }
    | { type: NotificationActionType.RemoveFriendRequest; payload: FriendRequestNotification }

export function reducer(state: NotificationState, action: NotificationAction): NotificationState {
    let {friendRequestNotifications} = state;
    const {count} = state;

    switch (action.type) {
        case NotificationActionType.AddChat:
            const exists = state.chatNotifications.some(n => n.chatId === action.payload.chatId);
            if (exists) {
                console.warn(`Chat with ID ${action.payload.chatId} already exists in notifications.`);
                return state;
            }
            const chatNotifications = [...state.chatNotifications, action.payload];
            const friendRequests = state.friendRequestNotifications;
            const nextCount = {
                chats: chatNotifications.length,
                friendRequests: friendRequests.length,
                sidebar: chatNotifications.length + friendRequests.length,
            };

            return {...state, chatNotifications, count: nextCount};
        case NotificationActionType.RemoveChat:
            const updatedChatNotifications = state.chatNotifications.filter(n => n.chatId !== action.payload.chatId);
            console.log("updatedChatNotifications", updatedChatNotifications);
            return {
                ...state,
                chatNotifications: updatedChatNotifications,
                count: {
                    ...state.count,
                    chats: Math.max(0, count.chats - 1),
                    sidebar: Math.max(0, count.sidebar - 1),
                }
            };
        case NotificationActionType.AddFriendRequest:
            friendRequestNotifications = [...friendRequestNotifications, action.payload];
            return {
                ...state,
                friendRequestNotifications,
                count: {
                    ...state.count,
                    friendRequests: state.count.friendRequests + 1,
                    sidebar: state.chatNotifications.length + state.friendRequestNotifications.length
                }
            };

        case NotificationActionType.RemoveFriendRequest:
            friendRequestNotifications = friendRequestNotifications.filter(n => n.userTag !== action.payload.userTag);
            console.log("friendRequestNotifications", friendRequestNotifications);
            return {
                ...state,
                friendRequestNotifications,
                count: {
                    ...state.count,
                    friendRequests: Math.max(0, count.friendRequests - 1),
                    sidebar: Math.max(0, count.sidebar - 1),
                }
            };
        default:
            throw new Error(`Unknown action type: in NotificationReducer.ts: ${(action as NotificationAction).type}`);
    }
}