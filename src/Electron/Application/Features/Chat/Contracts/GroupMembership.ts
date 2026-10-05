export class AddGroupMemberCommand implements MediatorRequest {
    type = AddGroupMemberCommand.name;

    constructor(
        public readonly groupId: string,
        public readonly userTag: string,
    ) { }
}

export class RemoveGroupMemberCommand implements MediatorRequest {
    type = RemoveGroupMemberCommand.name;

    constructor(
        public readonly groupId: string,
        public readonly userTag: string,
    ) { }
}
