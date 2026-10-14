import { FriendContract } from '../Models/FriendContract.js';
export class AcceptFriendRequestCommand implements MediatorRequest<FriendContract> {
    declare readonly _response?: FriendContract;
    public readonly type = 'AcceptFriendRequestCommand';
    constructor(public readonly friendTag: string) { }
}
