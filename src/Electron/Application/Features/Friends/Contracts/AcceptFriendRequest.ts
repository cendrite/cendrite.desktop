export class AcceptFriendRequestCommand implements MediatorRequest {
    public readonly type = 'AcceptFriendRequestCommand';
    constructor(public readonly friendTag: string) { }
}
