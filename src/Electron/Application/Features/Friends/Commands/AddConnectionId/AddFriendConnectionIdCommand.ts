export class AddFriendConnectionIdCommand implements MediatorRequest {
    type = "AddConnectionIdCommand";
    id: string;
    connectionId: string [];

    constructor(friendId: string, ...connectionId: string[]) {
        this.id = friendId;
        this.connectionId = connectionId;
    }
}
