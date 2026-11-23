import { ChatPrivileges } from '../Enums/ChatPrivileges.js';

export class ChangeMemberPrivilegeCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'ChangeMemberPrivilegeCommand';
    constructor(
        public readonly groupId: string,
        public readonly userTag: string,
        public readonly privilege: ChatPrivileges,
    ) { }
}
