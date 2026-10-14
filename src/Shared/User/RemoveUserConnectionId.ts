export class RemoveUserConnectionIdCommand implements MediatorRequest {
    public readonly type = RemoveUserConnectionIdCommand.name;
    public readonly connectionId: string;

    constructor(connectionId: string){
        this.connectionId = connectionId;
    }
}
