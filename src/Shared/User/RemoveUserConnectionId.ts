export class RemoveUserConnectionIdCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = RemoveUserConnectionIdCommand.name;
    public readonly connectionId: string;

    constructor(connectionId: string){
        this.connectionId = connectionId;
    }
}
