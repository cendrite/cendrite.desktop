export class AddFriendConnectionIdCommand implements MediatorRequest {
    type = "AddFriendConnectionIdCommand";
    id: string;
    connectionId: string [];

    constructor(friendId: string, ...connectionId: string[]) {
        this.id = friendId;
        this.connectionId = connectionId;
    }
}
