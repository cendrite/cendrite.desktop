import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';

export class GroupMember {
    constructor(
        public readonly userTag: string,
        public displayName: string,
        public privilege: ChatPrivileges,
        public joinedAtVersion: number,
        public writeKeys: string[] = [],
        public inviteKeys: string[] = [],
        public connectionIds: string[] = [],
    ) { }
}
