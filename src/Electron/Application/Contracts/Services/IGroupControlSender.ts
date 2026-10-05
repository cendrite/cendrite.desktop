import { Payload, PayloadType } from '../Messaging/Envelope.js';

export interface IGroupControlSender {
    send(payloadType: PayloadType, payload: Payload, connectionIds: string[]): Promise<void>;
}
