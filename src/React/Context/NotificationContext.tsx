import React from "react";

//export interface ChatNotification {}

export interface FriendRequestNotification {
    userTag: string;
}

export class NotificationState {
    //chatNotifications: ChatNotification[];
    friendRequestNotifications: FriendRequestNotification[];
    count: {
        chats: number;
        friendRequests: number;
        sidebar: number;
    }

    constructor() {
  //      this.chatNotifications = [];
        this.friendRequestNotifications = [];
        this.count = {chats: 0, friendRequests: 0, sidebar: 0}
    }
}

export enum ActionType {
    AddChat =0,
    RemoveChat = 1,
    AddFriendRequest = 2,
    RemoveFriendRequest = 3,
}

export type NotificationAction =
 //   | { type: ActionType.AddChat; payload: ChatNotification }
 //   | { type: ActionType.RemoveChat; payload: ChatNotification }
    | { type: ActionType.AddFriendRequest; payload: FriendRequestNotification }
    | { type: ActionType.RemoveFriendRequest; payload: FriendRequestNotification }

function reducer(state: NotificationState, action: NotificationAction): NotificationState {
    let { friendRequestNotifications } = state;
    const { count } = state;


    switch (action.type) {
        // case ActionType.AddChat:
        //     throw new Error('Method not implemented.');
        // case ActionType.RemoveChat:
        //     throw new Error('Method not implemented.');

        case ActionType.AddFriendRequest:
            friendRequestNotifications = [...friendRequestNotifications, action.payload];
            return {
                ...state,
                friendRequestNotifications,
                count: {
                    ...state.count,
                    friendRequests: state.count.friendRequests + 1,
                    sidebar: state.count.sidebar + 1
                }
            };

        case ActionType.RemoveFriendRequest:
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
            return state;
    }
}
export interface NotificationContextType {
    state: NotificationState;
    dispatch: React.Dispatch<NotificationAction>;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = React.useReducer(reducer, new NotificationState());

    return (
        <NotificationContext.Provider value={{ state, dispatch }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = React.useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};