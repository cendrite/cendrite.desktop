export class AddUserConnectionIdCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = AddUserConnectionIdCommand.name;
    public readonly connectionId: string;

    constructor(connectionId: string) {
        this.connectionId = connectionId;
    }
}
