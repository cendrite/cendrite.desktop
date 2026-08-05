export class DeleteFriendCommand implements MediatorRequest {
    type = "DeleteFriendCommand";
    id: string;
    /** Skips the remote delete. Set when the friendship is already gone server-side
     *  (FriendRemoved change event, or pruning a friend the sync no longer returns). */
    localOnly: boolean;

    constructor(tag: string, localOnly: boolean = false) {
        this.id = tag;
        this.localOnly = localOnly;
    }
}
