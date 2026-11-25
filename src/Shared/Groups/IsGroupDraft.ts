export class IsGroupDraftQuery implements MediatorRequest<boolean> {
    declare readonly _response?: boolean;
    public readonly type = 'IsGroupDraftQuery';
    constructor(public readonly groupId: string) { }
}
