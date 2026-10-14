export class DeclineFriendRequestCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'DeclineFriendRequestCommand';
    constructor(public readonly friendTag: string) { }
}
