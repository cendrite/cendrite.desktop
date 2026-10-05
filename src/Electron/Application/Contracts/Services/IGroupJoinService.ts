import { GroupCreatedPayload, LedgerAdvancedPayload } from '../Messaging/Envelope.js';

export interface IGroupJoinService {
    /** Builds the whole group from what the creator sent: keys, members, devices. Asks for nothing back. */
    join(payload: GroupCreatedPayload, senderConnectionId: string): Promise<void>;

    /** Replays the ledger after a membership change and makes the local chat match it. */
    catchUp(payload: LedgerAdvancedPayload): Promise<void>;
}
