export class SendFriendRequestCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'SendFriendRequestCommand';
    constructor(public readonly friendTag: string) { }
}
