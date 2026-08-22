import { MessageContract } from '../../../Contracts/Models/MessageContract.js';

export class TransmitMessageCommand implements MediatorRequest {
    type = 'TransmitMessageCommand';
    public readonly message: MessageContract;
    public readonly connectionIds: string[];
    public readonly participants: string[];

    public constructor(message: MessageContract, connectionIds: string[], participants: string[]) {
        this.message = message;
        this.connectionIds = connectionIds;
        this.participants = participants;
    }
}
