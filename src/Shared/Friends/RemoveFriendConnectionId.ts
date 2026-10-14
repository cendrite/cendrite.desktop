
export class RemoveFriendConnectionIdCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    type = "RemoveFriendConnectionIdCommand";
    id: string;
    connectionId: string[];

    constructor(friendId: string, ...connectionId: string[]) {
        this.id = friendId;
        this.connectionId = connectionId;
    }
}
