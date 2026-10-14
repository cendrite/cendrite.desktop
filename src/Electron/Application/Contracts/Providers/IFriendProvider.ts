import { Result } from '../../../../Shared/Result/Result.js';
import { FriendshipDirection } from '../../../../Shared/Enums/FriendshipDirection.js';
import { FriendshipStatus } from '../../../../Shared/Enums/FriendshipStatus.js';

export interface GetProfileResponse {
    username: string;
    userTag: string;
    displayName: string | null;
    avatarKey: string | null;
    friendshipStatus: FriendshipStatusDto;
}

export interface FriendRequestResponse {
    userTag: string;
    username: string;
    displayName: string | null;
    avatarKey: string | null;
    isSeen: boolean;
}

export interface FriendResponse {
    username: string;
    userTag: string;
    displayName: string | null;
    avatarKey: string | null;
    connectionIds: string[];
}

export interface AcceptFriendRequestResponse {
    username: string;
    tag: string;
    displayName: string | null;
    profilePictureUrl?: string;
    connectionIds: string[];
}

export class FriendshipStatusDto {
    status?: FriendshipStatus;
    direction!: FriendshipDirection;
}

export interface IFriendProvider {
    sendFriendRequest(userTag: string): Promise<Result>;
    getFriendRequests(): Promise<Result<FriendRequestResponse[]>>;
    declineFriendRequest(userTag: string): Promise<Result>;
    acceptFriendRequest(userTag: string): Promise<Result<AcceptFriendRequestResponse>>;
    getFriends(): Promise<Result<FriendResponse[]>>;
    deleteFriend(userTag: string): Promise<Result>;
    getProfile(userTag: string): Promise<Result<GetProfileResponse | void>>;
}
