export class AddGroupMemberCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'AddGroupMemberCommand';
    constructor(
        public readonly groupId: string,
        public readonly friendId: string,
    ) { }
}
