
export interface ProfilePictureUpdatedEvent{
    userTag: string;
    profilePictureUrl: string;
}

export interface FriendRequestEvent {
    tag: string;
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
}