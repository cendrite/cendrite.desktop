export class DeleteGroupCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'DeleteGroupCommand';
    constructor(public readonly groupId: string) { }
}
