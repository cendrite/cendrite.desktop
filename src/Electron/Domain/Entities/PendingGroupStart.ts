import { GroupMemberRef } from '../Protocol/LedgerOperation.js';

export class PendingGroupStart {
    constructor(
        public readonly members: GroupMemberRef[],
        public readonly inviteKeys: Record<string, string>,
        public readonly payload: string,
        public readonly signature: string,
        public readonly hash: string,
    ) { }
}
