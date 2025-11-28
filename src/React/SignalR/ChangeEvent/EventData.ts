
export interface ProfilePictureUpdatedEvent{
    userTag: string;
    profilePictureUrl: string;
}

export interface FriendRequestEvent {
    tag: string;
    username: string;
    displayName: string | null;
    presignedProfilePictureUrl: string | null;
}

export interface FriendRequestRejectedEvent {
    tag: string;
}

export interface FriendRequestAcceptedEvent {
    tag: string;
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
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
