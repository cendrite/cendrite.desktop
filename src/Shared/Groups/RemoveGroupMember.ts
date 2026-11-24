export class RemoveGroupMemberCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'RemoveGroupMemberCommand';
    constructor(
        public readonly groupId: string,
        public readonly userTag: string,
    ) { }
}
