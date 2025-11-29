
export class RemoveFriendConnectionIdCommand {
    type = "RemoveConnectionIdCommand";
    id: string;
    connectionId: string[];

    constructor(friendId: string, ...connectionId: string[]) {
        this.id = friendId;
        this.connectionId = connectionId;
    }
}
