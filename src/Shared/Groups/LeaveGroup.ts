export class LeaveGroupCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'LeaveGroupCommand';
    constructor(public readonly groupId: string) { }
}
