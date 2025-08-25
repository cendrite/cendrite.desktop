export class DeleteFriendCommand implements MediatorRequest {
    type = "DeleteFriendCommand";
    id: string;
    constructor(tag: string) {
        this.id = tag;
    }
}