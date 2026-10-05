import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';
import { GroupMemberRef } from '../../../Domain/Operations/LedgerOperation.js';

export enum PayloadType {
    ChatMessage = 0,
    DeliveryStatus = 1,
    SettingsUpdate = 2,
    DeleteMessage = 3,
    EditMessage = 4,
    GroupCreated = 5,
    LedgerAdvanced = 7,
}

export class Envelope<T extends Payload> {
    constructor(
        public readonly payloadType: PayloadType,
        public readonly payload: T,
    ) { }
}

export abstract class Payload {
    constructor(public readonly participants: string[]) { }
}

export class MessagePayload extends Payload {
    constructor(
        public text: string,
        public media: MediaPointer[],
        public participants: string[],
        public deliveryStatus: DeliveryStatus,
        public groupId: string | null = null,
    ) {
        super(participants);
    }
}

export class DeliveryStatusPayload extends Payload {
    constructor(
        public messageIds: string[],
        public deliveryStatus: DeliveryStatus,
        public participants: string[],
    ) {
        super(participants);
    }
}

export class MediaPointer {
    constructor(
        public readonly id: string,
        public readonly type: string,
        public readonly iv: string,
        public readonly key: string,
    ) { }
}

/**
 * Everything a member needs to hold the group: the epoch key, the write key the creator minted for
 * them, and the membership the ledger was created with. Nothing is asked of the recipient in return.
 */
export class GroupCreatedPayload extends Payload {
    constructor(
        public readonly groupId: string,
        public readonly name: string,
        public readonly epoch: number,
        public readonly epochKey: string,
        public readonly writeKeyPrivate: string,
        public readonly members: GroupMemberRef[],
        participants: string[],
    ) {
        super(participants);
    }
}

/**
 * Tells members the ledger moved, and carries the head hash so a server serving two different logs
 * is caught over a channel it cannot forge.
 */
export class LedgerAdvancedPayload extends Payload {
    constructor(
        public readonly groupId: string,
        public readonly version: number,
        public readonly headHash: string,
        participants: string[],
    ) {
        super(participants);
    }
}
