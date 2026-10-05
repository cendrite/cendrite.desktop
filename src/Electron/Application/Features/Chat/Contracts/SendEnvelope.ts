import { PayloadType } from '../../../Contracts/Messaging/Envelope.js';

export class SendEnvelopeCommand implements MediatorRequest {
    type = SendEnvelopeCommand.name;

    constructor(
        public readonly payloadType: PayloadType,
        public readonly payload: unknown,
        public readonly connectionIds: string[],
    ) { }
}
