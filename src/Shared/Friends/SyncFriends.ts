import { FriendContract } from '../Models/FriendContract.js';
export class SyncFriendsQuery implements MediatorRequest<FriendContract[]> {
    declare readonly _response?: FriendContract[];
    public readonly type = 'SyncFriendsQuery';
}
