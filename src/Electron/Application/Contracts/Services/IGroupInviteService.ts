import {
    GroupInvitePayload,
    GroupWriteKeyOfferPayload,
    LedgerAdvancedPayload,
} from '../Messaging/Envelope.js';

export interface IGroupInviteService {
    /** Stores the group keys, catches up on the ledger, and shows the chat if the ledger agrees we are a member. */
    acceptInvite(payload: GroupInvitePayload, senderConnectionId: string): Promise<void>;
    /** Registers an invitee's write key in the ledger so they can write. */
    registerWriteKey(payload: GroupWriteKeyOfferPayload, senderConnectionId: string): Promise<void>;
    /** Catches up after another member wrote, and checks the head they claim matches ours. */
    catchUp(payload: LedgerAdvancedPayload): Promise<void>;
}
