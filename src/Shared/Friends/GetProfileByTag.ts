import { FriendshipDirection } from '../Enums/FriendshipDirection.js';
import { FriendshipStatus } from '../Enums/FriendshipStatus.js';

export class GetProfileByTagQuery implements MediatorRequest<ProfileDto | void> {
    declare readonly _response?: ProfileDto | void;
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
