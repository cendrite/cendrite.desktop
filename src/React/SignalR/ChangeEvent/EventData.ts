
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