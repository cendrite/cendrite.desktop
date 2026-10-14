export class AddFriendConnectionIdCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    type = "AddFriendConnectionIdCommand";
    id: string;
    connectionId: string [];

    constructor(friendId: string, ...connectionId: string[]) {
        this.id = friendId;
        this.connectionId = connectionId;
    }
}
