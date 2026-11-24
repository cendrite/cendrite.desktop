export const GROUP_NAME_MAX_LENGTH = 50;

export class RenameGroupCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'RenameGroupCommand';
    constructor(
        public readonly groupId: string,
        public readonly name: string,
    ) { }
}
