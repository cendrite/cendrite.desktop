export class SendFriendRequestCommand implements MediatorRequest {
    public readonly type = 'SendFriendRequestCommand';
    constructor(public readonly friendTag: string) { }
}
