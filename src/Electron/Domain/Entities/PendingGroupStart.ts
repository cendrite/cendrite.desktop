import { KeyGrant } from '../Protocol/KeyChanges.js';
import { GroupStrapPayload } from '../Protocol/Payload.js';

export class PendingGroupStart {
    constructor(
        public readonly straps: Record<string, GroupStrapPayload>,
        public readonly payload: string,
        public readonly signature: string,
        public readonly hash: string,
        public readonly invites: KeyGrant[],
    ) { }
}
