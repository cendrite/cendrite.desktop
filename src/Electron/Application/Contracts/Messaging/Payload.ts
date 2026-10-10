import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';

export enum PayloadType {
    ChatMessage = 0,
    DeliveryStatus = 1,
    SettingsUpdate = 2,
    DeleteMessage = 3,
    EditMessage = 4,
}

export class Envelope<T extends Payload> {
    public readonly payloads: T[];

    constructor(payloads: T[]);
    constructor(payload: T);
    constructor(input: T | T[]) {
        this.payloads = Array.isArray(input) ? input : [input];
    }
}

export abstract class Payload {
    abstract readonly type: PayloadType;
    constructor(public readonly participants: string[]) { }
}

export class MessagePayload extends Payload {
    type = PayloadType.ChatMessage;
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
    type = PayloadType.DeliveryStatus;
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
