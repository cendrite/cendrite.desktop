import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';

export enum PayloadType {
    ChatMessage = 0,
    DeliveryStatus = 1,
    SettingsUpdate = 2,
    DeleteMessage = 3,
    EditMessage = 4,
    GroupInvite = 5,
    GroupWriteKeyOffer = 6,
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

/** Carries the group keys over the pairwise session; they never touch the ledger. */
export class GroupInvitePayload extends Payload {
    constructor(
        public readonly groupId: string,
        public readonly epochKeys: Record<number, string>,
        public readonly atVersion: number,
        participants: string[],
    ) {
        super(participants);
    }
}

/** An invitee's answer: the public half of the write key it generated for this group. */
export class GroupWriteKeyOfferPayload extends Payload {
    constructor(
        public readonly groupId: string,
        public readonly writeKeyPublic: string,
        public readonly userTag: string,
        public readonly displayName: string,
        public readonly identityKey: string,
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
