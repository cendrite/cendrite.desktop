import { ChatPrivileges } from '../Enums/ChatPrivileges.js';

export class GetGroupPrivilegeQuery implements MediatorRequest<ChatPrivileges> {
    declare readonly _response?: ChatPrivileges;
    public readonly type = 'GetGroupPrivilegeQuery';
    constructor(public readonly groupId: string) { }
}
