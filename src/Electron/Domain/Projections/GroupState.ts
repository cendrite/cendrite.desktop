import { GroupMember } from './GroupMember.js';

export class GroupState {
    version = 0;
    headHash: Buffer = Buffer.alloc(32);
    epoch = 1;
    name: string | null = null;
    messageTtl: number | null = null;
    members = new Map<string, GroupMember>();
    rejected: number[] = [];

    constructor(public readonly groupId: string) { }

    public ownerOfWriteKey(writeKeyPublic: string): GroupMember | null {
        for (const member of this.members.values()) {
            if (member.writeKeys.includes(writeKeyPublic)) return member;
        }
        return null;
    }
}
