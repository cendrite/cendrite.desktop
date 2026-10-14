import { ChatPrivileges } from '../../../Shared/Enums/ChatPrivileges.js';

export class GroupMember {
    constructor(
        public readonly userTag: string,
        public displayName: string,
        public privilege: ChatPrivileges,
        public readonly identityKey: string,
        public joinedAtVersion: number,
        public writeKeys: string[] = [],
        public connectionIds: string[] = [],
    ) { }
}
