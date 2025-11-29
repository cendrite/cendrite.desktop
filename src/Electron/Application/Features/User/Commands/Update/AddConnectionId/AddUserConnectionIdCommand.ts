export class AddUserConnectionIdCommand implements MediatorRequest {
    public readonly type = AddUserConnectionIdCommand.name;
    public readonly connectionId: string;

    constructor(connectionId: string) {
        this.connectionId = connectionId;
    }
}
