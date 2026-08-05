import { FriendshipDirection } from '../../../Contracts/Enums/FriendshipDirection.js';
import { FriendshipStatus } from '../../../Contracts/Enums/FriendshipStatus.js';

export class GetProfileByTagQuery implements MediatorRequest {
    public readonly type = 'GetProfileByTagQuery';
    constructor(public readonly tag: string) { }
}

export interface ProfileDto {
    username: string;
    userTag: string;
    displayName: string | null;
    avatarKey: string | null;
    friendshipStatus?: FriendshipStatus;
    friendshipDirection: FriendshipDirection;
}
