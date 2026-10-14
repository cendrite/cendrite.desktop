export class LeaveGroupCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    type: string = LeaveGroupCommand.name;
    constructor(
        public readonly chatId: string,
        public readonly userTag: string,
        public readonly connectionIds: string[],
    ) { }
}
