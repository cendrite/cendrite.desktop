export interface FriendRequestNotification {
    userTag: string;
}

export interface ChatNotification {
    chatId: string;
}

export class NotificationState {
    chatNotifications: ChatNotification[];
    friendRequestNotifications: FriendRequestNotification[];
    count: {
        chats: number;
        friendRequests: number;
        sidebar: number;
    }

    constructor() {
        this.chatNotifications = [];
        this.friendRequestNotifications = [];
        this.count = {chats: 0, friendRequests: 0, sidebar: 0}
    }
}
