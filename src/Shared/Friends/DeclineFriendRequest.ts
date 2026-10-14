export class DeclineFriendRequestCommand implements MediatorRequest {
    public readonly type = 'DeclineFriendRequestCommand';
    constructor(public readonly friendTag: string) { }
}
