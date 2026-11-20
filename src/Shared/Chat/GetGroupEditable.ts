export class GetGroupEditableQuery implements MediatorRequest<boolean> {
    declare readonly _response?: boolean;
    public readonly type = 'GetGroupEditableQuery';
    constructor(public readonly groupId: string) { }
}
