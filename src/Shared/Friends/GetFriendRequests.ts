export class GetFriendRequestsQuery implements MediatorRequest {
    public readonly type = 'GetFriendRequestsQuery';
}

export interface FriendRequestDto {
    userTag: string;
    username: string;
    displayName: string | null;
    avatarKey: string | null;
    isSeen: boolean;
}
