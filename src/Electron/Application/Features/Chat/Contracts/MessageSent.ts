import { Payload } from '../../../Contracts/Messaging/Payload.js';
import { MessageContract } from '../../../../../Shared/Contracts/Models/MessageContract.js';

export class MessageSentCommand implements MediatorRequest {
    type = MessageSentCommand.name;
    public readonly message: MessageContract;
    public readonly connectionIds: string[];
    public readonly participants: string[];
    public readonly payloads: Record<string, Payload[]>;

    public constructor(
        message: MessageContract,
        connectionIds: string[],
        participants: string[],
        payloads: Record<string, Payload[]>,
    ) {
        this.message = message;
        this.connectionIds = connectionIds;
        this.participants = participants;
        this.payloads = payloads;
    }
}
