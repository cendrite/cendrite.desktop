
export interface AvatarUpdatedEvent{
    userTag: string;
    avatarKey: string;
}

export interface FriendRequestEvent {
    tag: string;
    username: string;
    displayName: string | null;
    avatarKey: string | null;
}

export interface FriendRequestRejectedEvent {
    tag: string;
}

export interface FriendRequestAcceptedEvent {
    tag: string;
    username: string;
    displayName: string | null;
    avatarKey: string | null;
    connectionIds: string[];
}

export interface FriendDeletedEvent {
    tag: string;
    deletedBy: string;
}

export interface UserLoggedInEvent { 
    connectionId: string;
    userTag: string;
}

export interface UserLoggedOutEvent {
    connectionId: string;
    userTag: string;
}
