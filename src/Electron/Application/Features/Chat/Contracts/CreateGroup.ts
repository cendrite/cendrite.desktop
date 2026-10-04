export class CreateGroupCommand implements MediatorRequest {
    type = CreateGroupCommand.name;

    constructor(
        public readonly groupId: string,
        public readonly name: string,
        public readonly memberTags: string[],
    ) { }
}
