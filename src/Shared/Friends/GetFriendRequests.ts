export class GetFriendRequestsQuery implements MediatorRequest<FriendRequestDto[]> {
    declare readonly _response?: FriendRequestDto[];
    public readonly type = 'GetFriendRequestsQuery';
}

export interface FriendRequestDto {
    userTag: string;
    username: string;
    displayName: string | null;
    avatarKey: string | null;
    isSeen: boolean;
}
