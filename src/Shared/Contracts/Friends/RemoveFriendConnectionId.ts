
export class RemoveFriendConnectionIdCommand implements MediatorRequest {
    type = "RemoveFriendConnectionIdCommand";
    id: string;
    connectionId: string[];

    constructor(friendId: string, ...connectionId: string[]) {
        this.id = friendId;
        this.connectionId = connectionId;
    }
}
