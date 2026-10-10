import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';

export enum PayloadType {
    ChatMessage = 0,
    DeliveryStatus = 1,
    SettingsUpdate = 2,
    DeleteMessage = 3,
    EditMessage = 4,
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
        public chatId: string,
        public text: string,
        public media: MediaPointer[],
        public participants: string[],
        public deliveryStatus: DeliveryStatus,
    ) {
        super(participants);
    }
}

export class DeliveryStatusPayload extends Payload {
    constructor(
        public chatId: string,
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
